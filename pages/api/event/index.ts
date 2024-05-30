// pages/api/events/index.ts

import { NextApiRequest, NextApiResponse } from "next";
import { EventService } from "@/services/EventService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { organizationid, currentPage, eventsPerPage } = req.query;
  const service = new EventService();

  try {
    const data = await service.fetchEvents(
      organizationid as string,
      parseInt(currentPage as string, 10),
      parseInt(eventsPerPage as string, 10)
    );
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
