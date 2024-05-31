// pages/api/roles/delete.ts

import { NextApiRequest, NextApiResponse } from "next";
import { RoleService } from "@/services/RoleService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { role_id } = req.query;
  const service = new RoleService();

  try {
    const result = await service.deleteRole(role_id as string);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
