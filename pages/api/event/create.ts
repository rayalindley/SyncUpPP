// pages/api/events/create.ts

import { NextApiRequest, NextApiResponse } from "next";
import { EventService } from "@/services/EventService";
import { Event } from "@/models_/Event";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const eventData = req.body;
  const event = new Event(
    "",
    eventData.title,
    eventData.description,
    new Date(eventData.starteventdatetime),
    new Date(eventData.endeventdatetime),
    eventData.location,
    eventData.capacity,
    eventData.registrationfee,
    eventData.privacy,
    eventData.organizationid,
    eventData.eventphoto,
    eventData.tags,
    eventData.slug
  );

  const service = new EventService();

  try {
    const data = await service.insertEvent(event);
    return res.status(201).json(data);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
}
