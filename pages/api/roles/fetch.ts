// pages/api/roles/fetch.ts

import { NextApiRequest, NextApiResponse } from "next";
import { RoleService } from "@/services/RoleService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { org_id } = req.query;
  const service = new RoleService();

  try {
    const result = await service.fetchRoles(org_id as string);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
