import { createClient } from "@/lib/supabase/client";
import { recordActivity } from "@/lib/track";
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
    // Update organization member
    const { data: memberData, error: memberError } = await supabase
      .from("organizationmembers")
      .select("*")
      .eq("userid", paymentData.payerId)
      .eq("organizationid", paymentData.organizationId)
      .single();

    if (memberError) {
      console.error("Error fetching member:", memberError);
      return res.status(500).json({ error: "Failed to fetch member", memberError });
    }

    // Calculate new expiration date
    const currentDate = new Date();
    const expirationDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1)); // Add 1 month

    // Update existing member
    const { data: updatedMemberData, error: updateMemberError } = await supabase
      .from("organizationmembers")
      .update({ 
        membershipid: paymentData.target_id,
        expiration_date: expirationDate.toISOString()
      })
      .eq("userid", paymentData.payerId)
      .eq("organizationid", paymentData.organizationId)
      .select()
      .single();

    if (updateMemberError) {
      console.error("Error updating member:", updateMemberError);
      return res.status(500).json({
        error: "Failed to update member",
        updateMemberError,
        target_id: paymentData.target_id,
        payerId: paymentData.payerId,
        organizationId: paymentData.organizationId,
      });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("organization_memberships")
      .select("*")
      .eq("membershipid", paymentData.target_id)
      .eq("organizationid", paymentData.organizationId)
      .single();

    await recordActivity({
      organization_id: paymentData.organizationId,
      activity_type: "membership_subscribe",
      description: `User has subscribed to the ${membership?.name} membership.`,
    });

    await recordActivity({
      activity_type: "membership_subscribe",
      description: `User subscribed to the ${membership?.name} membership in ${membership?.orgname}.`,
    });

    return res.status(200).json({
      success: "MEMBERSHIP UPDATED & PAYMENT SUCCESSFUL!",
      memberData: updatedMemberData,
    });
  } else if (paymentData.type === "events") {
    const { data: registrationData, error: registrationError } = await registerForEvent(
      paymentData.target_id,
      paymentData.payerId
    );

    if (registrationError) {
      console.error("Error registering for event:", registrationError);
      return res.status(500).json({
        error: "Failed to register for event",
        registrationError,
        target_id: paymentData.target_id,
        payerId: paymentData.payerId,
      });
    }

    //fetch org name
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("name")
      .eq("organizationid", paymentData.organizationId)
      .single();

    // fetch event name with eventid
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("title")
      .eq("eventid", paymentData.target_id)
      .single();

    //record activity
    await recordActivity({
      organization_id: paymentData.organizationId,
      activity_type: "event_register",
      description: `User has registered for the ${eventData?.title}.`,
    });

    await recordActivity({
      activity_type: "event_register",
      description: `User has registered for the ${eventData?.title} event in ${orgData?.name}.`,
    });

    return res.status(200).json({
      success: "EVENT REGISTRATION & PAYMENT SUCCESSFUL!",
      registrationData,
    });
  } else {
    return res.status(400).json({ error: "Invalid payment type." });
  }
}

async function registerForEvent(eventId: string, userId: string) {
  try {
    // Fetch event to check privacy setting
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("privacy, organizationid")
      .eq("eventid", eventId)
      .single();

    if (eventError || !event) {
      return { data: null, error: { message: eventError?.message || "Event not found" } };
    }

    // Check if the event is private
    if (event.privacy === "private") {
      // Check if the user is a member of the organization
      const { data: membership, error: membershipError } = await supabase
        .from("organizationmembers")
        .select("organizationmemberid")
        .eq("userid", userId)
        .eq("organizationid", event.organizationid)
        .single();

      if (membershipError || !membership) {
        return {
          data: null,
          error: { message: "User is not a member of the organization" },
        };
      }

      const organizationMemberId = membership.organizationmemberid;

      // Register the user for the event
      const { data: registrationData, error: registrationError } = await supabase
        .from("eventregistrations")
        .insert([
          {
            userid: userId,
            eventid: eventId,
            organizationmemberid: organizationMemberId,
            registrationdate: new Date().toISOString(),
            status: "registered",
          },
        ])
        .select()
        .single();

      if (registrationError) {
        return { data: null, error: { message: registrationError.message } };
      }

      return { data: registrationData, error: null };
    } else {
      // Public event, register the user without checking membership
      const { data: registrationData, error: registrationError } = await supabase
        .from("eventregistrations")
        .insert([
          {
            userid: userId,
            eventid: eventId,
            registrationdate: new Date().toISOString(),
            status: "registered",
          },
        ])
        .select()
        .single();

      if (registrationError) {
        return { data: null, error: { message: registrationError.message } };
      }

      return { data: registrationData, error: null };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}
