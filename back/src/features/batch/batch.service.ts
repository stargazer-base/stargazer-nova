import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  async syncYouTubeVideos() {
    console.log("YouTube APIから最新動画を取得します...");

    const apiKey = process.env.YOUTUBE_API_KEY;

    // JSONファイルのパスを指定して読み込む
    const jsonPath = path.join(__dirname, "channels.json");
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const channels = JSON.parse(rawData);
    console.log(`合計 ${channels.length} 件のチャンネルを処理します。`);
    // チャンネルごとにループ処理を実行
    for (const channel of channels) {
      console.log(`\n▶ [${channel.name}] の動画を取得中...`);

      try {
        // 【ステップ1】Search APIで最新動画の「ID」だけを取得する
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&maxResults=5&order=date&type=video&key=${apiKey}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.items || searchData.items.length === 0) {
          console.log("新しい動画は見つかりませんでした。");
          continue;
        }

        // 取得した動画のIDをカンマ区切りでまとめる (例: "id1,id2,id3")
        const videoIds = searchData.items
          .map((item: any) => item.id.videoId)
          .join(",");

        // 【ステップ2】Videos APIで、まとめたIDの詳細情報（時間など）を一括取得する
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`;
        const videosResponse = await fetch(videosUrl);
        const videosData = await videosResponse.json();

        console.log(
          `${videosData.items.length}件の動画データをDBに書き込みます...`,
        );

        // 【ステップ3】詳細データを使ってDBに保存（Upsert）
        for (const item of videosData.items) {
          const videoId = item.id;
          const videoUrl = `https://youtube.com/watch?v=${videoId}`;
          const snippet = item.snippet;
          const contentDetails = item.contentDetails;

          // 時間をきれいにする
          const formattedDuration = formatYouTubeDuration(
            contentDetails?.duration,
          );

          await prisma.video.upsert({
            where: { url: videoUrl },
            update: {
              title: snippet.title,
              thumbnailUrl: snippet.thumbnails.high.url,
              duration: formattedDuration, // 更新時にも反映
            },
            create: {
              title: snippet.title,
              url: videoUrl,
              thumbnailUrl: snippet.thumbnails.high.url,
              oshiName: channel.name,
              tags: [],
              duration: formattedDuration,
              publishedAt: snippet.publishedAt,
            },
          });
        }

        console.log(`  └ ${videosData.items.length} 件の動画を処理しました。`);
      } catch (error) {
        // ★重要：特定のチャンネルでエラーが起きても、システムを落とさずにエラーログだけ残して次のチャンネルへ進む
        console.error(
          `  └ [エラー] ${channel.name} の処理中に問題が発生しました:`,
          error,
        );
        throw error;
      }
    }
  }
}
