import { CombinedUserData } from './combined_user_data';
import { Events } from './events';
import { OrganizationMembers } from './organization_members';

export interface EventRegistrations {
  eventregistrationid: string;
  eventid?: string;
  organizationmemberid?: string;
  registrationdate?: string;
  status?: any;
  userid?: string;
  events?: Events;
  organizationmembers?: OrganizationMembers;
  combined_user_data?: CombinedUserData;
}
