import type { NextApiRequest, NextApiResponse } from "next";
const { WebhookClient } = require('dialogflow-fulfillment');
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  const agent = new WebhookClient({ request:req, response:res});

  async function getUserData(agent: any) {
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if(error || !data?.length) {
      agent.add("Sorry, I couldn't fetch the user data.");
    } else {
      agent.add(`User name: ${data[0].name}, Email" ${data[0].email}`);
    }
  }

  const intentMap = new Map();
  intentMap.set("GetUserInfo", getUserData);
  agent.handleRequest(intentMap);
}