import type { NextApiRequest, NextApiResponse } from "next";
import { InferenceClient } from "@huggingface/inference";

type ExplainRequest = {
  prompt: string;
};

type ExplainResponse =
  | { explanation: string | undefined }
  | { error: string };

const client = new InferenceClient(process.env.HUGGINGFACE_TOKEN!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExplainResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body as ExplainRequest;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const result = await client.chatCompletion({
      provider: "auto",
      model: "microsoft/phi-4",
      messages: [
        {
          role: "user",
          content: `${prompt}`,
        },
      ],
    });

    return res.status(200).json({
      explanation: result.choices[0].message.content,
    });
  } catch (err: any) {
    console.error("🔥 Error:", err);
    return res.status(500).json({ error: "Failed to get response from HF" });
  }
}
