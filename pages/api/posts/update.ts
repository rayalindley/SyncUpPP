// pages/api/posts/update.ts

import { NextApiRequest, NextApiResponse } from "next";
import { PostService } from "@/services/PostService";
import { Post } from "@/models/Post";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { postid, content, privacylevel, postphotos } = req.body;
  const post = new Post(
    postid,
    "",
    "",
    content,
    privacylevel,
    undefined,
    undefined,
    postphotos
  );
  const service = new PostService();

  try {
    const result = await service.updatePost(post);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
