import { Memberships } from "./memberships";
import { Organization_roles } from "./roles";
import { Combined_user_data } from "./users";

export interface Organizations {
  organizationid: string /* primary key */;
  name: string;
  description?: string;
  adminid?: string /* foreign key to combined_user_data.id */;
  created_at?: string;
  organization_type?: string;
  industry?: string;
  organization_size?: string;
  website?: string;
  date_established?: string;
  address?: JSON;
  socials?: JSON;
  slug: string;
  photo?: string;
  banner?: string;
  combined_user_data?: Combined_user_data;
}

export interface Organization_memberships {
  organizationid?: string /* primary key */;
  orgname?: string;
  slug?: string;
  membershipid?: string /* primary key */;
  name?: string;
  description?: string;
  registrationfee?: any; // type unknown;
  features?: any; // type unknown;
  mostPopular?: boolean;
  yearlydiscount?: any; // type unknown;
  membership_count?: number;
}

export interface Organization_roles_view {
  organizationid?: string /* primary key */;
  name?: string;
  description?: string;
  banner?: string;
  created_at?: string;
  adminid?: string /* foreign key to combined_user_data.id */;
  organization_type?: string;
  industry?: string;
  organization_size?: string;
  website?: string;
  date_established?: string;
  address?: JSON;
  socials?: JSON;
  slug?: string;
  photo?: string;
  roles?: any; // type unknown;
  combined_user_data?: Combined_user_data;
}

export interface Organizationmembers {
  organizationmemberid: string /* primary key */;
  organizationid?: string /* foreign key to organizations.organizationid */;
  userid?: string /* foreign key to combined_user_data.id */;
  membershipid?: string /* foreign key to memberships.membershipid */;
  roleid?: string /* foreign key to organization_roles.role_id */;
  joindate?: string;
  enddate?: string;
  months?: number;
  organizations?: Organizations;
  combined_user_data?: Combined_user_data;
  memberships?: Memberships;
  organization_roles?: Organization_roles;
}
