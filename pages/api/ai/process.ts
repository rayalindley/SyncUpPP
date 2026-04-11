import type { NextApiRequest, NextApiResponse } from "next";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

/* =========================
   Server-side Supabase
========================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // REQUIRED (bypasses RLS)
);

/* =========================
   Groq Client
========================= */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

/* =========================
   Types
========================= */
type FeedbackRow = {
  id: string;
  text: string;
  likert: number | null;
  event_id: string | null;
};

type GroqResult = {
  translation?: string;
  summary?: string;
  sentiment?: {
    label?: string;
    score?: number;
  };
  likert?: number;
  keywords?: string[];
  recommendations?: string[];
};

/* =========================
   Groq Call
========================= */
async function analyzeFeedback(text: string) {
  const prompt = `
You are a strict JSON generator. Analyze the feedback below and return ONLY a single valid JSON object. 

FEEDBACK:
"${text}"

The JSON object must have the following fields:

{
  "translation": string,            // English translation of feedback
  "summary": string,                // 2–3 sentence summary of feedback
  "sentiment": {
    "label": "Positive" | "Neutral" | "Negative"
    "score": number                 // 1 (positive), 0 (neutral) and -1 (negative)
  },
  "keywords": string[],             // array of important keywords, may be empty
  "recommendations": string[]       // actionable recommendations, may be empty
}

Rules:

1. RETURN ONLY VALID JSON. Do NOT include explanations, markdown, or comments.
2. Always use numbers, not ranges or placeholders.
3. Fill missing fields with sensible defaults: 
   - translation: "" 
   - summary: "" 
   - sentiment.label: "Neutral" 
   - sentiment.score: 0 
   - keywords: [] 
   - recommendations: []
4. The JSON must be parseable by JSON.parse().

Respond with the JSON object only.

`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 400,
  });

  const raw =
    completion.choices?.[0]?.message?.content?.trim() ?? "";

  try {
    return {
      ok: true,
      parsed: JSON.parse(raw) as GroqResult,
      raw,
    };
  } catch {
    return { ok: false, parsed: null, raw };
  }
}

/* =========================
   API Handler
========================= */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id } = req.body as { id?: string };

    if (!id) {
      return res.status(400).json({ error: "id required" });
    }

    /* =========================
       1. Fetch unprocessed feedbacks
    ========================= */
    const { data: feedbacks, error } = await supabase
      .from("feedbacks")
      .select("id, text, likert, event_id")
      .eq("event_id", id)
      .eq("processed", false)
      .limit(200);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch feedbacks" });
    }
    
    if (!feedbacks || feedbacks.length === 0) {
      return res
        .status(200)
        .json({ message: "No feedbacks to process." });
    }

    /* =========================
       2. Analyze feedbacks
    ========================= */
    const analyses = [];

    for (const fb of feedbacks) {
      const result = await analyzeFeedback(fb.text);

      analyses.push({
        feedback_id: fb.id,
        translation: result.parsed?.translation ?? null,
        summary: result.parsed?.summary ?? null,
        sentiment_label:
          result.parsed?.sentiment?.label?.toLowerCase() ?? null,
        sentiment_score:
          typeof result.parsed?.sentiment?.score === "number"
            ? result.parsed.sentiment.score
            : null,
        likert:
          typeof result.parsed?.likert === "number"
            ? result.parsed.likert
            : fb.likert,
        keywords: result.parsed?.keywords ?? [],
        recommendations: result.parsed?.recommendations ?? [],
        raw_response: result.raw,
      });

      await supabase
        .from("feedbacks")
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq("id", fb.id);
    }

    /* =========================
       3. Insert feedback_analyses
    ========================= */
    await supabase.from("feedback_analyses").insert(analyses);

    /* =========================
       4. Aggregate report
    ========================= */
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
    };

    const likertCounts: Record<number, number> = {};
    const keywordFreq: Record<string, number> = {};
    let sumLikert = 0;
    let likertTotal = 0;

    for (const a of analyses) {
      const s = a.sentiment_label ?? "neutral";
      sentimentCounts[s as keyof typeof sentimentCounts]++;

      if (typeof a.likert === "number") {
        likertCounts[a.likert] =
          (likertCounts[a.likert] || 0) + 1;
        sumLikert += a.likert;
        likertTotal++;
      }

      for (const k of a.keywords) {
        keywordFreq[k] = (keywordFreq[k] || 0) + 1;
      }
    }

    const avgLikert =
      likertTotal > 0 ? sumLikert / likertTotal : null;

    const summaries = analyses
      .map((a) => a.summary)
      .filter(Boolean)
      .slice(0, 5);

    /* =========================
       5. Insert feedback_reports
    ========================= */
    const { data: report } = await supabase
      .from("feedback_reports")
      .insert({
        event_id: id,
        generated_at: new Date().toISOString(),
        total_feedbacks: analyses.length,
        avg_likert: avgLikert,
        likert_counts: likertCounts,
        sentiment_counts: sentimentCounts,
        top_keywords: keywordFreq,
        summaries,
        raw_analyses: analyses,
      })
      .select()
      .single();

    return res.status(200).json({
      message: "Feedback processed",
      processed: analyses.length,
      report,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Processing failed" });
  }
}
