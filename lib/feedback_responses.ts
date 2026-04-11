import { createClient } from "@/lib/supabase/client";

export async function fetchIndividualFeedbackResponses(id: string) {
  const supabase = createClient();

  // Fetch all responses for the event, along with the attendee details and specific answers
  const { data, error } = await supabase
    .from("form_responses")
    .select(`
      id,
      comment,
      submitted_at,
      attendee:user_profiles!form_responses_attendee_id_fkey(first_name, last_name, email),
      form_answers (
        answer,
        question:questions (
          question_text,
          question_type
        )
      ),
      forms!inner(event_id)
    `)
    .eq("forms.event_id", id)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching individual feedback:", error);
    return null;
  }

  return data;
}