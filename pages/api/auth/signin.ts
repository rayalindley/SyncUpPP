// pages/api/auth/signin.ts

import { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "@/services/AuthService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body;
  const service = new AuthService();

  try {
    await service.signInWithPassword(email, password);
    return res.status(200).end();
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
