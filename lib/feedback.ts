"use server";
import { createClient } from "@/lib/supabase/server";

export const checkIfRegisteredUser = async (userId: string, slug: string) => {
  const supabase = createClient();

  // 1) Resolve event by slug (events table uses `id`)
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title")
    .eq("eventslug", slug)
    .maybeSingle();

  if (eventError || !event) {
    console.error("[checkIfRegisteredUser] Event lookup failed", {
      slug,
      eventError,
      event,
    });
    return false;
  }

  // 2) Check registration by eventid + userid (eventregistrations uses `eventid`)
  const { data: reg, error: regError } = await supabase
    .from("eventregistrations")
    .select("eventregistrationid, eventid, userid, status")
    .eq("eventid", event.id)
    .eq("userid", userId)
    .maybeSingle();

  if (regError) {
    console.error("[checkIfRegisteredUser] Registration lookup failed", {
      slug,
      eventId: event.id,
      userId,
      regError,
    });
    return false;
  }

  const isRegistered = !!reg;

  console.log("[checkIfRegisteredUser] Result", {
    slug,
    eventId: event.id,
    userId,
    matchedRegistration: reg ?? null,
    isRegistered,
  });

  return isRegistered;
};

export async function deleteForm(formId: number, slug: string) {
  const supabase = createClient();

  await supabase
    .from("events")
    .update({ has_feedback_form: false })
    .eq("eventslug", slug);

  return await supabase
    .from("forms")
    .delete()
    .eq("id", formId);
}

export async function hasSubmittedResponse(userId: string, slug: string) {
  const supabase = createClient();

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("id")
    .eq("slug", slug)
    .single();

  if (formError || !form) return false;

  const { data: response, error: responseError } = await supabase
    .from("form_responses")
    .select("id")
    .eq("form_id", form.id)
    .eq("attendee_id", userId)
    .maybeSingle();

  return !!response && !responseError;
}