// pages/api/memberships/delete.ts

import { NextApiRequest, NextApiResponse } from "next";
import { MembershipService } from "@/services/MembershipService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { membershipid } = req.query;
  const service = new MembershipService();

  try {
    await service.deleteMembership(membershipid as string);
    return res.status(204).end();
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
