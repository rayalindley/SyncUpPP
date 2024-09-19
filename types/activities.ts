export type Activity = {
  id: number;
  user_id: string;
  organization_id: string;
  activity_type: string;
  description: string;
  activity_details: any; // Adjust type as needed based on expected structure
  created_at: string;
};
