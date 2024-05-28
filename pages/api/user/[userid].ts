// pages/api/organization/user/[userUuid].ts
import { NextApiRequest, NextApiResponse } from "next";
import { OrganizationService } from "@/services/OrganizationService";
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();
const organizationService = new OrganizationService(supabase);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userUuid } = req.query;

  if (req.method === "GET") {
    try {
      const organizations = await organizationService.getUserOrganizations(
        userUuid as string
      );
      res.status(200).json(organizations);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
