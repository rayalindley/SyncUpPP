import { NextApiRequest, NextApiResponse } from "next";
import { GoogleAuth, JWTInput } from "google-auth-library";
import axios from "axios";
import fs from "fs";
import path from "path";

let credentials: JWTInput;

if (process.env.VERCEL) {
  const decoded = Buffer.from(process.env.GOOGLE_KEY_PATH!, "base64").toString("utf-8");
  credentials = JSON.parse(decoded);
} else {
  const filePath = path.join(process.cwd(), process.env.GOOGLE_KEY_PATH!);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  credentials = JSON.parse(fileContent);
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Missing query input" });
  }

  try {
    const auth = new GoogleAuth({
      credentials, // 👈 Use the loaded credentials
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const projectId = "syncup2-457313";
    const sessionId = "user-session";
    const url = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/sessions/${sessionId}:detectIntent`;

    const dialogflowResponse = await axios.post(
      url,
      {
        queryInput: {
          text: {
            text: query,
            languageCode: "en",
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
        },
      }
    );

    const reply = dialogflowResponse.data.queryResult.fulfillmentText;
    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error("Error from Dialogflow:", error.message || error);
    return res.status(500).json({ error: "Error communicating with Dialogflow" });
  }
}