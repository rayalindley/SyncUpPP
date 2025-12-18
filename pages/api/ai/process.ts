import type { NextApiRequest, NextApiResponse } from "next";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { feedback } = req.body;

  if (!feedback)
    return res.status(400).json({ error: "Missing feedback" });

  const prompt = `
You are an event evaluation AI assistant.
Analyze the feedback below and ALWAYS respond in VALID JSON ONLY.

FEEDBACK:
"${feedback}"

Return JSON in this format:

{
  "translation": "English translation",
  "summary": "2–3 sentence summary",
  "sentiment": {
    "label": "Positive | Neutral | Negative | Mixed | Sarcastic",
    "score": "float between -1 and 1"
  },
  "likert": 1-5,
  "keywords": ["word1", "word2", ...],
  "recommendations": ["rec1", "rec2"]
}

RULES:
- Respond with ONLY raw JSON. No markdown.
- If unsure, make your best reasonable guess.
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return res.status(200).json({ raw });
    }

    return res.status(200).json({ result: parsed });

  } catch (error) {
    console.error("Groq error:", error);
    return res.status(500).json({ error: "AI processing failed" });
  }
}
