import { Organizations } from '@/types/organizations';
import { CombinedUserData } from '@/types/combined_user_data';
import { Memberships } from '@/types/memberships';
export interface Posts {
  postid: string;
  organizationid: string;
  authorid: string;
  content?: string;
  privacylevel?: string;
  targetmembershipid?: string;
  createdat?: string;
  organizations?: Organizations;
  combined_user_data?: CombinedUserData;
  memberships?: Memberships;
  postphoto?: string;
  postphotos?: string[];
}
