// app/actions/insertActivity.ts
import { createClient } from "./supabase/client";


type ActivityDetails = {
  user_id?: string; // Add user_id to the type
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

  const activityData: {
    organization_id?: string | null;
    user_id?: string; // Add user_id to the activityData type
    activity_type: string;
    description: string;
    activity_details?: Record<string, unknown> | null;
  } = {
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

    console.log(data, error);

  if (error) {
    throw new Error(`Failed to insert activity: ${error.message}`);
  }
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
