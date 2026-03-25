import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must be service role to update rows
);

async function aiRequest(prompt: string) {
  const response = await fetch("https://api.fireworks.ai/inference/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 300,
      prompt,
    }),
  });

  const json = await response.json();
  return json.choices[0].text.trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { feedbackreportid, feedback_text } = req.body;

    if (!feedbackreportid || !feedback_text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🌐 STEP 1: Translate
    const translation = await aiRequest(
      `Translate this text into English only:\n\n${feedback_text}`
    );

    // 📝 STEP 2: Summarize
    const summary = await aiRequest(
      `Summarize the following text into 2 short sentences:\n\n${translation}`
    );

    // 🔍 STEP 3: Keywords
    const keywordsRaw = await aiRequest(
      `Extract 3–5 keywords from this text. Return ONLY a JSON array:\n\n${translation}`
    );

    let keywords: string[] = [];
    try {
      keywords = JSON.parse(keywordsRaw);
    } catch {
      keywords = []; // fallback if parsing fails
    }

    // 😊 STEP 4: Sentiment (JSON output)
    const sentimentRaw = await aiRequest(`
      Analyze the sentiment of this feedback. 
      Return ONLY valid JSON:

      {
        "label": "Positive | Neutral | Negative | Mixed",
        "score": float between -1 and 1
      }

      TEXT:
      ${translation}
    `);

    let sentiment: any = {};
    try {
      sentiment = JSON.parse(sentimentRaw);
    } catch {
      sentiment = { label: "Unknown", score: 0 };
    }

    // 1–5 Likert scale from sentiment strength
    const likertScore = sentiment.score
      ? Math.min(5, Math.max(1, Math.round(((sentiment.score + 1) / 2) * 5)))
      : 3;

    // 💾 STEP 5: Save results into Supabase
    const { error } = await supabase
      .from("feedbackreports")
      .update({
        keywords,
        sentiment,
        summary,
        translation,
        likert: likertScore,
      })
      .eq("feedbackreportid", feedbackreportid);

    if (error) throw error;

    return res.status(200).json({
      message: "Feedback processed successfully",
      data: {
        translation,
        summary,
        keywords,
        sentiment,
        likert: likertScore,
      },
    });

  } catch (err: any) {
    console.error("AI PROCESS ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
