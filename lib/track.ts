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

    console.log(data, error);

  if (error) {
    throw new Error(`Failed to insert activity: ${error.message}`);
  }

  return data;
}



export async function isActiveMember(user_id: string, organization_id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user_id)
    .eq('organization_id', organization_id)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    throw new Error(`Failed to check if user is active member: ${error.message}`);    
  }

  return data && data.length > 0;
}
