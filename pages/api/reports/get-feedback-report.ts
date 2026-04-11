import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { eventId } = req.query;
  if (!eventId || typeof eventId !== "string") {
    return res.status(400).json({ error: "eventId required" });
  }

  try {
    const { data, error } = await supabase
      .from("feedback_reports")
      .select("*")
      .eq("event_id", eventId)
      .order("generated_at", { ascending: false });

    if (error) throw error;

    console.log(`Fetched ${data?.length ?? 0} feedback reports for event ${eventId}`);  
    console.log("Sample report:", data?.[0].summary);
    return res.status(200).json({ reports: data });
  } catch (err: any) {
    console.error("Fetch feedback reports error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}