import { CombinedUserData } from '@/types/combined_user_data';

export interface UserProfiles {
  userid: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  profilepicture?: string;
  website?: string;
  updatedat?: string;
  id: number;
  combined_user_data?: CombinedUserData;
}
