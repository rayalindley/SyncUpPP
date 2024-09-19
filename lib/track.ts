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
  user_id = undefined,
  organization_id = null,
  activity_type,
  description,
  activity_details = null
}: ActivityDetails) {
  const supabase = createClient();

  const activityData = {
    organization_id, // Can be null
    activity_type,
    description,
    activity_details // Can be null
  };

  if (user_id) {
    activityData.user_id = user_id; // Add user_id if provided
  }

  const { data, error } = await supabase
    .from('activities')
    .insert([activityData]);

  console.log(data, error);

  if (error) {
    throw new Error(`Failed to insert activity: ${error.message}`);
  }
}
