import type { NextApiRequest, NextApiResponse } from "next";
const { WebhookClient } = require('dialogflow-fulfillment');
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  const agent = new WebhookClient({ request:req, response:res});

  async function getData(agent: any) {
    const { data, error } = await supabase.from("userprofiles").select("*").limit(1);

    if(error || !data?.length) {
      agent.add("Sorry, I couldn't fetch the user data.");
    } else {
      agent.add(`User name: ${JSON.stringify(data[0])}`);
    }
  }

  const intentMap = new Map();
  intentMap.set('Get Data', getData);
  agent.handleRequest(intentMap);
}