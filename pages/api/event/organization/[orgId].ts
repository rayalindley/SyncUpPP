// pages/api/event/organization/[orgId].ts
import { NextApiRequest, NextApiResponse } from "next";
import { EventService } from "@/services/EventService";
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();
const eventService = new EventService(supabase);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orgId } = req.query;

  if (req.method === "GET") {
    try {
      const events = await eventService.getEventsByOrganization(orgId as string);
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
