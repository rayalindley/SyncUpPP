import { CombinedUserData } from '@/types/combined_user_data';
import { Organizations } from '@/types/organizations';
import { OrganizationRoles } from '@/types/organization_roles';

export interface UserMembershipInfo {
  userid?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  profilepicture?: string;
  website?: string;
  updatedat?: string;
  organizationmemberid?: string;
  organizationid?: string;
  roleid?: string;
  joindate?: string;
  enddate?: string;
  organization_slug?: string;
  role_name?: string;
  role_color?: string;
  role_deletable?: boolean;
  role_editable?: boolean;
  membership_name?: string;
  membership_description?: string;
  membership_fee?: any;
  membership_features?: any;
  combined_user_data?: CombinedUserData;
  organizations?: Organizations;
  organization_roles?: OrganizationRoles;
}
