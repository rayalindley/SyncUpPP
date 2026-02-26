import { CombinedUserData } from './combined_user_data';
import { Event } from './event';
import { OrganizationMembers } from './organization_members';

export interface EventRegistrations {
  eventregistrationid: string;
  id: string;
  organizationmemberid?: string;
  registrationdate?: string;
  status?: any;
  userid?: string;
  events?: Event;
  organizationmembers?: OrganizationMembers;
  combined_user_data?: CombinedUserData;
}
