import { Organizations } from "./organizations";
import { Organization_roles } from "./roles";

export interface Combined_user_data {
  id?: string;
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  website?: string;
  updatedat?: string;
  profilepicture?: string;
}

export interface Userprofiles {
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
  combined_user_data?: Combined_user_data;
}

export interface User_membership_info {
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
  combined_user_data?: Combined_user_data;
  organizations?: Organizations;
  organization_roles?: Organization_roles;
}
