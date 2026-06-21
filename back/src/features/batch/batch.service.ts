import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// YouTubeの特殊な時間形式(PT10M30S)を「10:30」や「1:05:00」に変換する関数
function formatYouTubeDuration(duration: string): string {
  if (!duration) return "00:00";

  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "00:00";

  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");

  // 1時間以上ある場合は「H:MM:SS」、それ以外は「MM:SS」
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export class BatchService {
  async syncYouTubeVideos(mode: "full" | "delta" = "delta") {
    console.log("YouTube APIから最新動画を取得します...");

    const apiKey = process.env.YOUTUBE_API_KEY;

    // JSONファイルのパスを指定して読み込む
    const jsonPath = path.join(__dirname, "channels.json");
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const channels = JSON.parse(rawData);
    console.log(`=== バッチ処理開始 (モード: ${mode}) ===`);

    for (const channel of channels) {
      try {
        console.log(`▶ チャンネル[${channel.name}] の処理を開始...`);

        // 新しいJSON構成からプレイリストIDを直接取得（API呼び出しをスキップ！）
        const uploadsPlaylistId = channel.playlistId;

        if (!uploadsPlaylistId) {
          console.warn(`プレイリストが見つかりませんでした: ${channel.name}`);
          continue;
        }

        // ② モードに応じて動画IDのリストを取得
        let videoIds: string[] = [];
        let nextPageToken = "";

        if (mode === "delta") {
          // 【差分更新】最新20件だけを1回の通信で取得
          const playlistRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${apiKey}`,
          );
          const playlistData = await playlistRes.json();

          if (playlistData.items) {
            videoIds = playlistData.items.map(
              (item: any) => item.snippet.resourceId.videoId,
            );
          } else {
            console.warn(
              `[警告] 動画データがありません（APIエラーの可能性）:`,
              playlistData,
            );
          }
        } else {
          // 【初回全件】ページがなくなるまで全部めくるループ
          do {
            const pageParam = nextPageToken
              ? `&pageToken=${nextPageToken}`
              : "";
            const playlistRes = await fetch(
              `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}${pageParam}`,
            );
            const playlistData = await playlistRes.json();

            if (!playlistData.items) {
              console.warn(
                `[警告] ページ取得中にデータが途切れました。APIエラー内容:`,
                playlistData,
              );
              break;
            }

            const ids = playlistData.items.map(
              (item: any) => item.snippet.resourceId.videoId,
            );
            videoIds.push(...ids);

            // undefinedの場合は空文字にして無限ループを防止
            nextPageToken = playlistData.nextPageToken || "";
          } while (nextPageToken !== "");
        }

        console.log(`  取得した動画ID: ${videoIds.length} 件`);

        // 取得した動画が0件なら詳細取得とDB保存をスキップ
        if (videoIds.length === 0) {
          console.log(`  保存する動画がないためスキップします。`);
          continue;
        }

        // 取得した動画IDを50件ずつの「塊（チャンク）」に分割
        const chunkSize = 50;
        for (let i = 0; i < videoIds.length; i += chunkSize) {
          const chunkIds = videoIds.slice(i, i + chunkSize);
          const idsString = chunkIds.join(",");

          // 詳細情報（再生時間など）を取得
          const videoRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${idsString}&key=${apiKey}`,
          );
          const videoData = await videoRes.json();

          if (!videoData.items) continue;

          // データベースに保存 (upsert: あれば更新、なければ作成)
          for (const item of videoData.items) {
            // YouTube APIにvideoUrlはないのでIDから自作する
            const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;

            await prisma.video.upsert({
              where: { url: videoUrl },
              update: {
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails?.high?.url || "",
                duration: formatYouTubeDuration(item.contentDetails?.duration),
              },
              create: {
                id: item.id,
                title: item.snippet.title,
                url: videoUrl,
                thumbnailUrl: item.snippet.thumbnails?.high?.url || "",
                oshiName: channel.name, // JSONの name を使用
                tags: [channel.dispName], // JSONの dispName を使用
                duration: formatYouTubeDuration(item.contentDetails?.duration),
                publishedAt: item.snippet.publishedAt,
              },
            });
          }
        }
        console.log(`  チャンネル[${channel.name}] の処理完了！`);
      } catch (error) {
        console.error(
          `[エラー] チャンネル ${channel.name} の処理中に失敗しました:`,
          error,
        );
      } finally {
        // APIのレート制限を考慮して、少し待機（5秒）
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    console.log(`=== バッチ処理完了 ===`);
  }
}
