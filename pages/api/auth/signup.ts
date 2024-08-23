// pages/api/auth/signup.ts

import { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "@/services/AuthService";
import { User } from "@/models_/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password, firstName, lastName } = req.body;
  const user = new User(email, password, firstName, lastName);
  const service = new AuthService();

  try {
    await service.signUp(user);
    return res.status(201).end();
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
