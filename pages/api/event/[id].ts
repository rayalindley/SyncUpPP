// pages/api/event/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { EventService } from "@/services/EventService";
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();
const eventService = new EventService(supabase);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const event = await eventService.getEventById(id as string);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else if (req.method === "PUT") {
    try {
      const updatedData = req.body;
      const updatedEvent = await eventService.updateEvent(id as string, updatedData);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else if (req.method === "DELETE") {
    try {
      await eventService.deleteEvent(id as string);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
