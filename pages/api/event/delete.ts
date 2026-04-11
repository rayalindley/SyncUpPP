// pages/api/events/delete.ts

import { NextApiRequest, NextApiResponse } from "next";
import { EventService } from "@/services/EventService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const service = new EventService();

  try {
    await service.deleteEvent(id as string);
    return res.status(204).end();
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
