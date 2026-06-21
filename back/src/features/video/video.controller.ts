import { Request, Response } from "express";
import { VideoService } from "./video.service";

const videoService = new VideoService();

export class VideoController {
  // GET /api/videos
  async getVideos(req: Request, res: Response) {
    try {
      const type = (req.query.type as string) || "title";
      const keyword = (req.query.keyword as string) || "";

      const videos = await videoService.searchVideos(type, keyword);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "動画の取得に失敗しました" });
    }
  }

  // POST /api/videos/tags
  async addTagsToVideos(req: Request, res: Response) {
    try {
      const { videoIds, tags } = req.body;

      // 簡易的なバリデーション
      if (
        !videoIds ||
        !Array.isArray(videoIds) ||
        !tags ||
        !Array.isArray(tags)
      ) {
        return res.status(400).json({ error: "パラメータが不正です" });
      }

      const result = await videoService.updateVideoTags(videoIds, tags);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "タグの更新に失敗しました" });
    }
  }
}
