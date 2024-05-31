// pages/api/roles/insert.ts

import { NextApiRequest, NextApiResponse } from "next";
import { RoleService } from "@/services/RoleService";
import { Role } from "@/models/Role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { role, color, org_id, deletable, editable } = req.body;
  const newRole = new Role("", org_id, role, color, deletable, editable);
  const service = new RoleService();

  try {
    const result = await service.insertRole(newRole);
    return res.status(201).json(result);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
