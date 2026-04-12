import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseFelbertSummary(raw: string): { summary: string; recommendations: string[] } {
  // Split on "Suggestions:" or "Suggestions :"
  const parts = raw.split(/Suggestions\s*:/i);
  
  const summaryRaw = parts[0]
    .replace(/^Summary\s*:/i, "")
    .trim();

  const recommendationsRaw = parts[1] ?? "";
  const recommendations = recommendationsRaw
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);

  return { summary: summaryRaw, recommendations };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { eventId, feedbackIds, results, keywords, summary, organizationId, generatedBy } = req.body;

  const positive = results.filter((r: any) => r.sentiment === "Positive").length;
  const negative = results.filter((r: any) => r.sentiment === "Negative").length;

  const { summary: parsedSummary, recommendations } = parseFelbertSummary(summary);


  // inside insert:
  const { error: insertError } = await supabase.from("feedback_reports").insert({
    event_id: eventId,
    organization_id: organizationId,  // ← add
    generated_by: generatedBy,        // ← add
    model: "felbert",
    generated_at: new Date().toISOString(),
    total_feedbacks: results.length,
    sentiment_counts: { positive, negative, neutral: 0, mixed: 0 },
    top_keywords: keywords,
    summary: parsedSummary,
    recommendations,
    raw_analyses: results,
  });

  if (insertError) return res.status(500).json({ error: insertError.message });

  // Decrement report_limit
  const { data: eventData, error: fetchError } = await supabase
    .from("events")
    .select("report_limit")
    .eq("id", eventId)
    .single();

  if (!fetchError && eventData) {
    await supabase
      .from("events")
      .update({ report_limit: (eventData.report_limit ?? 1) - 1 })
      .eq("id", eventId);
  }

  return res.status(200).json({ message: "Report saved." });
}