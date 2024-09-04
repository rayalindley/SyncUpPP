
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
