import { Router } from "express";
import { VideoController } from "./video.controller";

const router = Router();
const videoController = new VideoController();

// 動画検索・一覧取得
router.get("/", videoController.getVideos);

// タグ一括更新
router.post("/tags", videoController.addTagsToVideos);

export default router;
