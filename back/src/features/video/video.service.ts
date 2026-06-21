import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. pgドライバーを使って接続プールを作成
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// 2. Prisma用のアダプターに変換
const adapter = new PrismaPg(pool);

// 3. 最新のPrisma v7仕様に合わせて、アダプターを渡して初期化！
const prisma = new PrismaClient({ adapter });
export class VideoService {
  // ==========================================
  // 動画検索ロジック
  // ==========================================
  async searchVideos(type: string, keyword: string) {
    // 検索条件（WHERE句）を組み立てるオブジェクト
    const whereClause: any = {};

    if (keyword) {
      if (type === "title") {
        // タイトルは「部分一致（contains）」で検索
        whereClause.title = { contains: keyword };
      } else if (type === "oshi") {
        // 推し名も「部分一致」で検索
        whereClause.oshiName = { contains: keyword };
      } else if (type === "tag") {
        // ★PostgreSQL配列型の特権！「配列の中にキーワードが含まれているか（has）」で検索
        whereClause.tags = { has: keyword };
      }
    }

    // Prismaを使ってDBから取得
    const videos = await prisma.video.findMany({
      where: whereClause,
      // 登録順（または新しい順）など並び替えも簡単に指定できます
      orderBy: { publishedAt: "desc" },
    });

    return videos;
  }

  // ==========================================
  // タグ一括付与ロジック
  // ==========================================
  async updateVideoTags(videoIds: string[], tags: string[]) {
    // 選択された複数の動画に対して、順番にタグを追加する処理の配列を作る
    const updatePromises = videoIds.map((id) => {
      return prisma.video.update({
        where: { id: id },
        data: {
          // ★PostgreSQL配列型の特権！既存の配列に新しい要素を「追加（push）」する
          tags: { push: tags },
        },
      });
    });

    // トランザクションで一気に実行（途中で失敗したら全てロールバックされる安全な仕組み）
    await prisma.$transaction(updatePromises);

    return {
      success: true,
      message: `${videoIds.length}件の動画にタグを一括付与しました。`,
      updatedIds: videoIds,
      appliedTags: tags,
    };
  }
}
