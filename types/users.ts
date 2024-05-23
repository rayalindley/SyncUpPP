import { Organizations } from "./organizations";
import { Organization_roles } from "./roles";

export interface Combined_user_data {
  id?: string /* primary key */;
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
  userid: string /* foreign key to combined_user_data.id */;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  profilepicture?: string;
  website?: string;
  updatedat?: string;
  id: number /* primary key */;
  combined_user_data?: Combined_user_data;
}

export interface User_membership_info {
  userid?: string /* foreign key to combined_user_data.id */;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  profilepicture?: string;
  website?: string;
  updatedat?: string;
  organizationmemberid?: string /* primary key */;
  organizationid?: string /* foreign key to organizations.organizationid */;
  roleid?: string /* foreign key to organization_roles.role_id */;
  joindate?: string;
  enddate?: string;
  organization_slug?: string;
  role_name?: string;
  role_color?: string;
  role_deletable?: boolean;
  role_editable?: boolean;
  membership_name?: string;
  membership_description?: string;
  membership_fee?: any; // type unknown;
  membership_features?: any; // type unknown;
  combined_user_data?: Combined_user_data;
  organizations?: Organizations;
  organization_roles?: Organization_roles;
}
