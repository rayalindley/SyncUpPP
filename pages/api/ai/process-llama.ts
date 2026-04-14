import type { NextApiRequest, NextApiResponse } from "next";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

/* =========================
   Server-side Supabase
========================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
);

/* =========================
   Groq Client
========================= */
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/* =========================
   Types
========================= */
type FeedbackRow = {
  id: string;
  comment: string;
  event_id: string | null;
};

type PerFeedbackResult = {
  translation: string;
  sentiment: { label: string; score: number };
  keywords: string[];
};

type Analysis = {
  feedback_id: string;
  translation: string | null;
  sentiment_label: string | null;
  sentiment_score: number | null;
  keywords: string[];
  raw_response: string;
};

/* =========================
   Stopwords (mirrors Flask)
========================= */
const STOPWORDS = new Set([
  "event","the","is","at","which","on","and","a","an","but","or","to","of",
  "in","for","with","by","it","was","as","be","are","this","that","from",
  "so","not","no","if","we","they","you","i","me","my","do","does","did",
  "have","has","had","will","just","about",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .match(/\b\w+\b/g)
    ?.filter((w) => !STOPWORDS.has(w)) ?? [];
}

/* =========================
   Step 1 — Per-feedback:
   translate + sentiment (parallel, one call each)
========================= */
async function analyzeOne(fb: FeedbackRow): Promise<{
  result: PerFeedbackResult;
  raw: string;
}> {
  const prompt = `
You are a strict JSON generator. Analyze the feedback below and return ONLY a valid JSON object.

FEEDBACK:
"${fb.comment}"

Return this exact shape:
{
  "translation": string,       // English translation (same text if already English)
  "sentiment": {
    "label": "Positive" | "Negative",
    "score": 1 | -1            // 1=Positive, -1=Negative
  },
  "keywords": string[]         // important keywords extracted from the ORIGINAL text
}

Rules:
1. Return ONLY valid JSON — no markdown, no explanation.
2. Defaults: translation="", sentiment.label="Negative", sentiment.score=-1, keywords=[].
`.trim();

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 300,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";

  try {
    const parsed = JSON.parse(raw) as PerFeedbackResult;
    return { result: parsed, raw };
  } catch {
    return {
      result: {
        translation: "",
        sentiment: { label: "Negative", score: -1 },
        keywords: extractKeywords(fb.comment),
      },
      raw,
    };
  }
}

/* =========================
   Step 2 — One summary call
   across ALL translated texts
   (mirrors Flask's phi-4 call)
========================= */
async function summarizeAll(translations: string[]): Promise<{
  summary: string;
  recommendations: string[];
}> {
  const bullet = translations.map((t) => `- ${t}`).join("\n");

  const prompt = `
You are a strict JSON generator analyzing event feedback. Your output will be parsed directly by JSON.parse() — any deviation will cause a system failure.

Analyze the following event feedback and return ONLY a valid JSON object.

FEEDBACK:
${bullet}

Return this EXACT shape:
{
  "summary": string,          // EXACTLY 3 sentences. No more, no less. Each sentence must cover a distinct aspect: (1) overall impression, (2) specific strengths, (3) specific weaknesses.
  "recommendations": string[] // EXACTLY 3–5 specific, actionable items. Each must start with a verb (e.g. "Improve", "Add", "Reduce"). No vague suggestions.
}

STRICT RULES — violations will break the system:
1. Return ONLY the raw JSON object. No markdown, no code fences, no explanation, no preamble.
2. Do NOT hallucinate, invent, or assume details not present in the feedback.
3. Do NOT copy feedback text verbatim — paraphrase and synthesize only.
4. summary MUST be EXACTLY 3 sentences. If feedback is too short, still write 3 sentences based only on what is provided.
5. recommendations MUST be an array of 3–5 strings. Never empty, never more than 5.
6. Every recommendation must be grounded in the actual feedback — do not add generic advice not supported by the input.
7. The JSON must be parseable by JSON.parse() with no modifications.
`.trim();

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";

  try {
    return JSON.parse(raw) as { summary: string; recommendations: string[] };
  } catch {
    return { summary: raw, recommendations: [] };
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
    const eventId = req.body.eventId ?? req.body.eventid ?? undefined;
    const organizationId = req.body.organizationId ?? undefined;
    const generatedBy = req.body.generatedBy ?? undefined;

    if (!eventId) return res.status(400).json({ error: "eventId required" });

    /* ── 1. Fetch unprocessed feedbacks ── */
    const { data: feedbacks, error } = await supabase
      .from("form_responses")
      .select("id, comment, event_id")
      .eq("event_id", eventId)
      .limit(200);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch feedbacks" });
    }

    if (!feedbacks || feedbacks.length === 0) {
      console.log("No feedbacks to process for eventId:", eventId);
      return res.status(200).json({ message: "No feedbacks to process." });
    }

    /* ── 2. Analyze all feedbacks IN PARALLEL (mirrors Flask batch) ── */
    const rawResults = await Promise.all(
      (feedbacks as FeedbackRow[]).map((fb) => analyzeOne(fb))
    );

    /* ── 3. One summary call across all translations ── */
    const translations = rawResults.map(
      (r) => r.result.translation || feedbacks[rawResults.indexOf(r)].comment
    );
    const { summary, recommendations } = await summarizeAll(translations);

    /* ── 4. Build analyses + aggregate in one pass ── */
    const analyses: Analysis[] = [];
    const sentimentCounts = { positive: 0, negative: 0 };
    const keywordFreq: Record<string, number> = {};

    for (let i = 0; i < feedbacks.length; i++) {
      const fb = feedbacks[i] as FeedbackRow;
      const { result, raw } = rawResults[i];

      const sentimentLabel = result.sentiment?.label?.toLowerCase() ?? "negative";
      const sentimentScore =
        typeof result.sentiment?.score === "number" ? result.sentiment.score : null;

      if (sentimentLabel in sentimentCounts) {
        sentimentCounts[sentimentLabel as keyof typeof sentimentCounts]++;
      }

      const words = [
        ...extractKeywords(fb.comment),
        ...(result.keywords ?? []),
      ];
      for (const w of words) {
        keywordFreq[w] = (keywordFreq[w] || 0) + 1;
      }

      analyses.push({
        feedback_id: fb.id,
        translation: result.translation || null,
        sentiment_label: sentimentLabel,
        sentiment_score: sentimentScore,
        keywords: result.keywords ?? [],
        raw_response: raw,
      });
    }

    /* ── 5. Batch insert analyses (one round-trip, not N) ── */
    const { error: analysesError } = await supabase
      .from("feedback_analyses")
      .insert(
        analyses.map((a) => ({
          ...a,
          summary,
          recommendations,
        }))
      );

    if (analysesError) {
      console.error("❌ feedback_analyses insert error:", analysesError);
    } else {
      console.log("✅ feedback_analyses inserted successfully");
    }

    /* ── 6. Insert report ── */
    const { data: report, error: reportError } = await supabase
      .from("feedback_reports")
      .insert({
        event_id: eventId,
        generated_at: new Date().toISOString(),
        organization_id: organizationId,
        generated_by: generatedBy,
        total_feedbacks: analyses.length,
        sentiment_counts: {
          positive: sentimentCounts.positive,
          negative: sentimentCounts.negative,
        },
        top_keywords: keywordFreq,
        summary,
        recommendations,
        model: "llama",
        raw_analyses: analyses,
      })
      .select()
      .single();

    if (reportError) {
      console.error("❌ feedback_reports insert error:", reportError);
    } else {
      console.log("✅ feedback_reports inserted successfully");
    }

    /* ── 7. Return everything at once (mirrors Flask's single response) ── */
    return res.status(200).json({
      message: "Feedback processed",
      total_feedbacks: analyses.length,
      results: analyses.map((a, i) => ({
        original: (feedbacks[i] as FeedbackRow).comment,
        translated: a.translation,
        sentiment: a.sentiment_label,
        sentiment_score: a.sentiment_score,
        keywords: a.keywords,
      })),
      top_keywords: keywordFreq,
      summary,
      recommendations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Processing failed" });
  }
}