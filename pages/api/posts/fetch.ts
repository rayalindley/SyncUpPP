// pages/api/posts/fetch.ts

import { NextApiRequest, NextApiResponse } from "next";
import { PostService } from "@/services/PostService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { organizationid } = req.query;
  const service = new PostService();

  try {
    const result = await service.fetchPosts(organizationid as string);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
