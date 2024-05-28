// pages/api/organization/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { OrganizationService } from "@/services/OrganizationService";
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();
const organizationService = new OrganizationService(supabase);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const organization = await organizationService.getOrganizationById(id as string);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.status(200).json(organization);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else if (req.method === "PUT") {
    try {
      const updatedData = req.body;
      const updatedOrganization = await organizationService.updateOrganization(
        id as string,
        updatedData
      );
      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.status(200).json(updatedOrganization);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else if (req.method === "DELETE") {
    try {
      await organizationService.deleteOrganization(id as string);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
