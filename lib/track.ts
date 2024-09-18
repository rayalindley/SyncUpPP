// app/actions/insertActivity.ts
import { createClient } from "./supabase/client";


type ActivityDetails = {
  user_id?: string;
  organization_id?: string | null; 
  activity_type: string;
  description: string;
  activity_details?: Record<string, unknown> | null; 
};

export async function recordActivity({
  organization_id = null, // Default to null if not provided
  activity_type,
  description,
  activity_details = null // Default to null if not provided
}: ActivityDetails) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activities')
    .insert([
      {
        organization_id, // Can be null
        activity_type,
        description,
        activity_details // Can be null
      }
    ]);

  if (error) {
    throw new Error(`Failed to insert activity: ${error.message}`);
  }

  return data;
}
