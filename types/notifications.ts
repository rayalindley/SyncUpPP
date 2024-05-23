import { Events } from "./events";
import { Organizationmembers } from "./organizations";

export interface Notifications {
  notificationid: string /* primary key */;
  organizationmemberid?: string /* foreign key to organizationmembers.organizationmemberid */;
  eventid?: string /* foreign key to events.eventid */;
  title?: string;
  eventdatetime?: string;
  orgname?: string;
  isread?: boolean;
  userid?: string;
  message?: string;
  created_on?: string;
  type?: string;
  path?: string;
  organizationmembers?: Organizationmembers;
  events?: Events;
}
