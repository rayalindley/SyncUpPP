import { createClient } from "@/lib/supabase/client";
import { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { body } = req;

  if (!body || !body.id) {
    return res.status(400).json({ error: "No data received." });
  }

  console.log("User: ", req.headers["x-user-id"]);
  console.log("Body: ", body);

  const { data, error } = await supabase
    .from("payments")
    .update({ status: "COMPLETED" })
    .eq("transaction_id", body.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating payment:", error);
    return res.status(500).json({ error: "Failed to update payment status" });
  } else {
    console.log("Updated payment status: ", data);
    return res.status(200).json({ success: "PAYMENT SUCCESSFUL!" });
  }
}
