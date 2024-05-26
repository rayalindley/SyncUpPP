import { createClient } from "@/lib/supabase/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getUser } from "@/lib/supabase/client";

const supabase = createClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { body } = req;

  if (!body || !body.id) {
    return res.status(400).json({ error: "No data received." });
  }

  console.log("Body: ", body);

  // Get user data
  const { user } = await getUser();

  // Update payment status and invoiceData
  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "COMPLETED",
      invoiceData: body.data, // assuming body.data contains the invoice data you want to update
    })
    .eq("invoiceid", body.id)
    .select()
    .single();

  if (paymentError) {
    console.error("Error updating payment:", paymentError);
    return res.status(500).json({ error: "Failed to update payment status" });
  }

  if (paymentData.type === "membership") {
    // Update or insert organization member
    const { data: memberData, error: memberError } = await supabase
      .from("organizationmembers")
      .select("organizationmemberid")
      .eq("userid", user?.id)
      .eq("organizationid", paymentData.organizationid)
      .single();

    if (memberError) {
      // Insert new member
      const { data: newMemberData, error: newMemberError } = await supabase
        .from("organizationmembers")
        .insert([
          {
            userid: user?.id,
            organizationid: paymentData.organizationid,
            membershipid: paymentData.target_id, // use the target_id for membership
            joindate: new Date().toISOString(),
            months: 1, // replace with the appropriate duration in months
          },
        ])
        .select()
        .single();

      if (newMemberError) {
        console.error("Error inserting new member:", newMemberError);
        return res.status(500).json({ error: "Failed to insert new member" });
      }

      return res
        .status(200)
        .json({ success: "PAYMENT SUCCESSFUL!", memberData: newMemberData });
    } else {
      // Update existing member
      const { data: updatedMemberData, error: updateMemberError } = await supabase
        .from("organizationmembers")
        .update({ membershipid: paymentData.target_id }) // use the target_id for membership
        .eq("organizationmemberid", memberData.organizationmemberid)
        .select()
        .single();

      if (updateMemberError) {
        console.error("Error updating member:", updateMemberError);
        return res.status(500).json({ error: "Failed to update member" });
      }

      return res
        .status(200)
        .json({ success: "PAYMENT SUCCESSFUL!", memberData: updatedMemberData });
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
