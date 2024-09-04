import { Organizations } from '@/types/organizations';
import { CombinedUserData } from '@/types/combined_user_data';
import { Memberships } from '@/types/memberships';
export interface Posts {
  postid: string;
  organizationid: string;
  authorid: string;
  content?: string;
  privacylevel?: any;
  targetmembershipid?: string;
  createdat?: string;
  postphoto?: string;
  organizations?: Organizations;
  combined_user_data?: CombinedUserData;
  memberships?: Memberships;
}
