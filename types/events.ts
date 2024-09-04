import { Organizations } from '@/types/organizations';
import { CombinedUserData } from '@/types/combined_user_data';
export interface Events {
  eventid: string;
  organizationid: string;
  title: string;
  description?: string;
  eventdatetime: string;
  location?: string;
  registrationfee?: any;
  createdat?: string;
  capacity?: number;
  adminid?: string;
  privacy?: any;
  eventphoto?: string;
  tags?: any;
  eventslug: string;
  organizations?: Organizations;
  combined_user_data?: CombinedUserData;
}
