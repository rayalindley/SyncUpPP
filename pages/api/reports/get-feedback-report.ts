import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  // console.log("event id:", req.query.id);
  
  const { eventId } = req.query.eventid ? { eventId: String(req.query.eventid) } : {};
  if (!eventId || typeof eventId !== "string") {
    console.warn("Missing or invalid eventId in query:", eventId);
    return res.status(400).json({ error: "eventId required" });
  }

  try {
    const { data, error } = await supabase
      .from("feedback_reports")
      .select("*")
      .eq("event_id", eventId)
      .order("generated_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ reports: data });
  } catch (err: any) {
    console.error("Fetch feedback reports error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}