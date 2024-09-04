import { OrganizationMembers } from '@/types/organization_members';
import { Events } from '@/types/events';
export interface Notifications {
  notificationid: string;
  organizationmemberid?: string;
  eventid?: string;
  title?: string;
  eventdatetime?: string;
  orgname?: string;
  isread?: boolean;
  userid?: string;
  message?: string;
  created_on?: string;
  type?: string;
  path?: string;
  organizationmembers?: OrganizationMembers;
  events?: Events;
}
