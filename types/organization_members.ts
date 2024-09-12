import { Organizations } from "@/types/organizations";
import { CombinedUserData } from "@/types/combined_user_data";
import { Memberships } from "@/types/memberships";
import { OrganizationRoles } from "@/types/organization_roles";

export interface OrganizationMembers {
  organizationmemberid: string;
  organizationid?: string;
  userid?: string;
  membershipid?: string;
  roleid?: string;
  joindate?: string;
  enddate?: string;
  months?: number;
  organizations?: Organizations;
  combined_user_data?: CombinedUserData;
  memberships?: Memberships;
  organization_roles?: OrganizationRoles;
}
