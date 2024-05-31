import { Events } from "./events";
import { Organizationmembers } from "./organizations";

export interface Notifications {
  notificationid: string;
  organizationmemberid?: string;
  eventid?: string;
  title?: string;
  eventdatetime?: string;
  starteventdatetime?: string;
  endeventdatetime?: string;
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
