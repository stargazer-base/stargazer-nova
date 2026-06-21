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

        // ① チャンネルの「アップロード済みプレイリストID」を取得
        const channelRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.id}&key=${apiKey}`,
        );
        const channelData = await channelRes.json();
        const uploadsPlaylistId =
          channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
          console.warn(`プレイリストが見つかりませんでした: ${channel.name}`);
          continue;
        }

        // ② モードに応じて動画IDのリストを取得
        let videoIds: string[] = [];
        let nextPageToken = "";

        if (mode === "delta") {
          // 【差分更新】最新20件だけを1回の通信でサクッと取得
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

          videoIds = playlistData.items.map(
            (item: any) => item.snippet.resourceId.videoId,
          );
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

            nextPageToken = playlistData.nextPageToken; // 次のページがあれば継続
          } while (nextPageToken !== "");
        }

        console.log(`  取得した動画ID: ${videoIds.length} 件`);

        // ③ 取得した動画IDを50件ずつの「塊（チャンク）」に分割
        const chunkSize = 50;
        for (let i = 0; i < videoIds.length; i += chunkSize) {
          const chunkIds = videoIds.slice(i, i + chunkSize);
          const idsString = chunkIds.join(",");

          // ④ 詳細情報（再生時間など）を取得
          const videoRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${idsString}&key=${apiKey}`,
          );
          const videoData = await videoRes.json();

          // ⑤ データベースに保存 (upsert: あれば更新、なければ作成)
          for (const item of videoData.items) {
            await prisma.video.upsert({
              where: { url: item.videoUrl },
              update: {
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails.high.url,
                duration: formatYouTubeDuration(item.contentDetails.duration), // 更新時にも反映
                // ... その他更新したい項目
              },
              create: {
                id: item.id,
                title: item.snippet.title,
                url: item.videoUrl,
                thumbnailUrl: item.snippet.thumbnails.high.url,
                oshiName: channel.name,
                tags: [channel.dispName],
                duration: formatYouTubeDuration(item.contentDetails.duration),
                publishedAt: item.snippet.publishedAt,
                // ... その他保存したい項目
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
        // エラーが起きても、次のチャンネルの処理へ進む（途中で止めない）
      } finally {
        // APIのレート制限を考慮して、少し待機（例: 1秒）
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    console.log(`=== バッチ処理完了 ===`);
  }
}
