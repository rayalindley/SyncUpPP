import type { NextApiRequest, NextApiResponse } from "next";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_TOKEN!);

type FeedbackRequest = { feedback: string };
type FeedbackResponse = { result: any } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedbackResponse>
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { feedback } = req.body as FeedbackRequest;
  if (!feedback) return res.status(400).json({ error: "Missing feedback" });

  try {
    const prompt = `
You are an event evaluation AI assistant. Analyze the feedback below and return JSON ONLY:

FEEDBACK: "${feedback}"

JSON FORMAT:
{
  "translation": "English translation of the feedback",
  "summary": "2–3 sentence summary",
  "sentiment": { "label": "Positive | Neutral | Negative", "score": float between -1 and 1 },
  "likert": integer 1-5,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "recommendations": ["short recommendation 1", "short recommendation 2"]
}
Rules: Only return valid JSON, no extra text.
`;

    const result = await client.chatCompletion({
      model: "meta-llama/Llama-2-7b-chat-hf",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.2,
    });

    const output = result.choices[0].message.content;
    let parsed;
    try { parsed = JSON.parse(output); } 
    catch (e) { return res.status(200).json({ result: output }); }

    return res.status(200).json({ result: parsed });
  } catch (err: any) {
    console.error("🔥 Error:", err);
    return res.status(500).json({ error: "Failed to get response from HF" });
  }
}
