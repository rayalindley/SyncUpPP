// pages/api/organization/update.ts

import { NextApiRequest, NextApiResponse } from "next";
import { OrganizationService } from "@/services/OrganizationService";
import { Organization } from "@/models/Organization";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { organizationid } = req.query;
  const organizationData = req.body;
  const organization = new Organization(
    organizationid as string,
    organizationData.name,
    organizationData.photo,
    organizationData.banner,
    organizationData.slug,
    organizationData.description,
    organizationData.organizationType,
    organizationData.industry,
    organizationData.organizationSize,
    organizationData.website,
    new Date(organizationData.dateEstablished),
    {
      addressLine1: organizationData.addressLine1,
      addressLine2: organizationData.addressLine2,
      city: organizationData.city,
      stateProvince: organizationData.stateProvince,
      country: organizationData.country,
    },
    {
      facebook: organizationData.facebookLink,
      twitter: organizationData.twitterLink,
      linkedin: organizationData.linkedinLink,
    }
  );

  const service = new OrganizationService();

  try {
    const data = await service.updateOrganization(organizationid as string, organization);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
