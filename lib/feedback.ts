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