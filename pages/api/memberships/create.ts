// pages/api/memberships/create.ts

import { NextApiRequest, NextApiResponse } from "next";
import { MembershipService } from "@/services/MembershipService";
import { Membership } from "@/models/Membership";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const membershipData = req.body;
  const membership = new Membership(
    "",
    membershipData.name,
    membershipData.description,
    membershipData.registrationfee,
    membershipData.organizationid,
    membershipData.features
  );

  const service = new MembershipService();

  try {
    const data = await service.insertMembership(membership);
    return res.status(201).json(data);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
