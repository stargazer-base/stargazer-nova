import type { Request, Response } from "express";
import { BatchService } from "./batch.service.js";

const batchService = new BatchService();

export class BatchController {
  async runYouTubeSync(req: Request, res: Response) {
    // 1. 簡単なセキュリティチェック（合言葉の確認）
    const authHeader = req.headers.authorization;
    const secretKey = process.env.BATCH_SECRET_KEY;

    if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
      return res
        .status(401)
        .json({ error: "Unauthorized: 無効なアクセスです" });
    }

    // 2. 合言葉が合っていればバッチ処理を実行
    try {
      console.log("バッチ処理を開始します...");
      await batchService.syncYouTubeVideos();

      res.json({ success: true, message: "YouTube同期バッチが完了しました" });
    } catch (error) {
      console.error("バッチ処理エラー:", error);
      res.status(500).json({ error: "バッチ処理中にエラーが発生しました" });
    }
  }
}
