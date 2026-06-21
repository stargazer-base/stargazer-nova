import "dotenv/config";

import express from "express";
import cors from "cors";
import videoRoutes from "./features/video/video.routes.js";
import batchRoutes from "./features/batch/batch.routes.js";

const app = express();
app.set("json spaces", 2);
const port = process.env.PORT || 3000;

// Angular（localhost:4200）からの通信を許可する
app.use(cors());
// JSONのPOSTリクエストを受け取れるようにする
app.use(express.json());

// ルーティングの適用
app.use("/api/videos", videoRoutes); // 追加（これで /api/videos 〜 でアクセス可能になります）
app.use("/api/batch", batchRoutes);

// 動作確認用のルーティング
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "推し天文台 API Server is running!" });
});

app.listen(port, () => {
  console.log(`Server is running`);
});
