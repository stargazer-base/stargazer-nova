import { PrismaClient } from "@prisma/client";
// ... PrismaClientの初期化 ...

export class BatchService {
  async syncYouTubeVideos() {
    // 1. YouTube APIを叩いて最新動画リストを取得（fetchなどを使用）
    const youtubeData = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=YOUR_API_KEY&...`,
    );
    const videos = await youtubeData.json();

    // 2. Prismaの upsert を使ってDBを安全に更新
    for (const item of videos.items) {
      await prisma.video.upsert({
        where: { url: `https://youtube.com/watch?v=${item.id.videoId}` }, // URLで一意に判定
        update: {
          // 既に存在する場合の更新内容（再生回数などを更新したい場合はここに書く）
        },
        create: {
          title: item.snippet.title,
          url: `https://youtube.com/watch?v=${item.id.videoId}`,
          thumbnailUrl: item.snippet.thumbnails.high.url,
          oshiName: "取得先チャンネルの設定等に依存",
          tags: [],
          duration: "APIから取得した時間",
          publishedAt: item.snippet.publishedAt,
        },
      });
    }
  }
}
