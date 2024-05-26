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

  // console.log("Body: ", body);

  // Get user data

  // Update payment status and invoiceData
  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "COMPLETED",
      invoiceData: body.data, // assuming body.data contains the invoice data you want to update
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

  if (paymentData.type === "membership") {
    // Update or insert organization member
    const { data: memberData, error: memberError } = await supabase
      .from("organizationmembers")
      .select("*")
      .eq("userid", paymentData.payerId)
      .eq("organizationid", paymentData.organizationId)
      .single();

    if (memberError) {
      // Insert new member
      const { data: newMemberData, error: newMemberError } = await supabase
        .from("organizationmembers")
        .insert([
          {
            organizationid: paymentData.organizationId,
            membershipid: paymentData.target_id, // use the target_id for membership
            months: 1, // replace with the appropriate duration in months
          },
        ])
        .select()
        .single();

      if (newMemberError) {
        return res
          .status(500)
          .json({ error: "Failed to insert new member", newMemberError });
      }

      return res
        .status(200)
        .json({ success: "CREATED & PAYMENT SUCCESSFUL!", memberData: newMemberData });
    } else {
      // Update existing member
      const { data: updatedMemberData, error: updateMemberError } = await supabase
        .from("organizationmembers")
        .update({ membershipid: paymentData.target_id }) // use the target_id for membership
        .eq("userid", paymentData.payerId)
        .eq("organizationid", memberData.organizationid)
        .select()
        .single();

      if (updateMemberError) {
        console.error("Error updating member:", updateMemberError);
        return res.status(500).json({
          error: "Failed to update member",
          updateMemberError,
          target_id: paymentData.target_id,
          payerId: paymentData.payerId,
          userid: memberData.userid,
        });
      }

      return res.status(200).json({
        success: "UPDATED & PAYMENT SUCCESSFUL!",
        memberData: updatedMemberData,
      });
    }
  } else if (paymentData.type === "event") {
    // Handle event type if needed
    // Placeholder comment for event handling
    return res.status(200).json({
      success: "PAYMENT SUCCESSFUL!",
      message: "Event handling not implemented yet.",
    });
  } else {
    return res.status(400).json({ error: "Invalid payment type." });
  }
}
