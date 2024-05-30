// pages/api/roles/update.ts

import { NextApiRequest, NextApiResponse } from "next";
import { RoleService } from "@/services/RoleService";
import { Role } from "@/models/Role";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { role_id, role, color, org_id, deletable, editable } = req.body;
  const updatedRole = new Role(role_id, org_id, role, color, deletable, editable);
  const service = new RoleService();

  try {
    const result = await service.updateRole(updatedRole);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
