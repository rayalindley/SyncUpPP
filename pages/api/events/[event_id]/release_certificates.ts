// Filename: pages/api/events/[event_id]/release_certificates.ts

import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { event_id } = req.query;

    if (!event_id || typeof event_id !== "string") {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const supabase = createClient();

    // Removed user authentication and permission checks

    // Fetch event data
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("eventid, organizationid")
      .eq("eventid", event_id)
      .single();

    if (eventError || !eventData) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Removed permission checks

    // Fetch certificate settings
    const { data: certSettings, error: certError } = await supabase
      .from("event_certificate_settings")
      .select("certificate_enabled")
      .eq("event_id", event_id)
      .single();

    if (certError || !certSettings?.certificate_enabled) {
      return res.status(400).json({ error: "Certificates are not enabled for this event" });
    }

    // Fetch registrants
    const { data: registrants, error: registrantsError } = await supabase
      .from("eventregistrations")
      .select("userid")
      .eq("eventid", event_id)
      .eq("status", "registered")
      .eq("attendance", "present");

    if (registrantsError) {
      return res.status(500).json({ error: "Failed to fetch registrants" });
    }

    if (!registrants || registrants.length === 0) {
      return res.status(400).json({ error: "No registrants found for this event" });
    }

    // Insert certificates
    const certificateInserts = registrants.map((registrant) => ({
      event_id: event_id,
      user_id: registrant.userid,
      release_status: "released",
    }));

    const { data: insertData, error: insertError } = await supabase
      .from("certificates")
      .upsert(certificateInserts, { onConflict: "event_id, user_id" });

    if (insertError) {
      return res.status(500).json({ error: "Failed to release certificates" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in handler:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
