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
  async searchVideos(
    type: string,
    keyword: string,
    page: number = 1,
    limit: number = 40,
  ) {
    const whereClause: any = {};
    if (keyword) {
      if (type === "title") whereClause.title = { contains: keyword };
      else if (type === "oshi") whereClause.oshiName = { contains: keyword };
      else if (type === "tag") whereClause.tags = { has: keyword };
    }

    // 件数カウントとデータ取得を同時に（並列で）行います
    const [totalCount, videos] = await prisma.$transaction([
      prisma.video.count({ where: whereClause }),
      prisma.video.findMany({
        where: whereClause,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit, // 例: 2ページ目なら、(2-1)*40 = 最初の40件をスキップ
        take: limit, // 40件だけ取得
      }),
    ]);

    return {
      videos,
      totalCount,
      totalPages: Math.ceil(totalCount / limit), // 全ページ数を計算
      currentPage: page,
    };
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
