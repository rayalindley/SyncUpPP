// pages/api/posts/delete.ts

import { NextApiRequest, NextApiResponse } from "next";
import { PostService } from "@/services/PostService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { postid, authorid } = req.body;
  const service = new PostService();

  try {
    const result = await service.deletePost(postid, authorid);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
