import { Address } from '@/types/address';
import { Socials } from '@/types/socials';
import { CombinedUserData } from '@/types/combined_user_data';
export interface Organizations {
  id?: string;
  selected: boolean;
  organizationid: string;
  name: string;
  description?: string | null;
  adminid?: string;
  created_at?: string;
  organization_type?: string;
  industry?: string;
  organization_size?: string | number;
  website?: string;
  date_established?: string;
  address?: Address;
  socials?: Socials;
  slug: string;
  photo?: string | null;
  banner?: string | null;
  combined_user_data?: CombinedUserData;
  total_members: number;
  total_posts: number;
  total_events: number;
}
