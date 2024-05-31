// pages/api/organization/[slug].ts

import { NextApiRequest, NextApiResponse } from "next";
import { OrganizationService } from "@/services/OrganizationService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { slug } = req.query;
  const service = new OrganizationService();

  try {
    const data = await service.fetchOrganizationBySlug(slug as string);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
