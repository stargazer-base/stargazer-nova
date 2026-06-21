import { Router } from "express";
import { BatchController } from "./batch.controller";

const router = Router();
const batchController = new BatchController();

// POSTリクエストでバッチを起動するエンドポイント
router.post("/youtube-sync", batchController.runYouTubeSync);

export default router;
