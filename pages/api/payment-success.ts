import { registerForEvent } from "@/lib/events";
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

  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "COMPLETED",
      invoiceData: body.data,
    })
    .eq("invoiceId", body.id)
    .select()
    .single();

  if (paymentError) {
    console.error("Error updating payment:", paymentError);
    return res
      .status(500)
      .json({ error: "Failed to update payment status", paymentError });
  }

  if (paymentData.type === "events") {
    const { data: registrationData, error: registrationError } = await registerForEvent(
      paymentData.target_id,
      paymentData.payerId
    );

    if (registrationError) {
      console.error("Error registering for event:", registrationError);
      return res.status(500).json({
        error: "Failed to register for event",
        registrationError,
        eventid: paymentData.target_id,
        organizationid: paymentData.organizationid,
        userid: paymentData.payerId,
      });
    }

    return res.status(200).json({
      success: "EVENT REGISTRATION & PAYMENT SUCCESSFUL!",
      registrationData,
    });
  } else {
    return res.status(400).json({ error: "Invalid payment type." });
  }
}
