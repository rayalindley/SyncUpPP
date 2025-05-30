"use server";
import { createClient } from "@/lib/supabase/server";

export const checkIfRegisteredUser = async (userId: string, slug: string) => {
  const supabase = createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("eventid")
    .eq("eventslug", slug)
    .single();

  if(eventError || !event) return false;

  const { data: reg, error: regError } = await supabase
    .from("eventregistrations")
    .select("eventregistrationid")
    .eq("eventid", event.eventid)
    .eq("userid", userId)
    .single();

  return !!reg && !regError;
}

export async function deleteForm(formId: number, slug: string) {
  const supabase = createClient();

  await supabase
    .from("events")
    .update({has_feedback_form: false})
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
