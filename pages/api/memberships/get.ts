// pages/api/memberships/get.ts

import { NextApiRequest, NextApiResponse } from "next";
import { MembershipService } from "@/services/MembershipService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { organizationid } = req.query;
  const service = new MembershipService();

  try {
    const data = await service.getMemberships(organizationid as string);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
