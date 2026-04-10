import { CombinedUserData } from './combined_user_data';
import { Event } from './event';
import { OrganizationMembers } from './organization_members';

export interface EventRegistrations {
  eventregistrationid: string;
  eventid: string;  // ✅ This is the column name in Supabase (foreign key to events.id)
  organizationmemberid?: string;
  registrationdate?: string;
  status?: any;
  userid?: string;
  events?: Event;  // ✅ Related Event object
  organizationmembers?: OrganizationMembers;
  combined_user_data?: CombinedUserData;
}