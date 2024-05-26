import { Organizationmembers, Organizations } from "./organizations";
import { Combined_user_data } from "./users";

export interface Events {
  eventid: string /* primary key */;
  organizationid: string /* foreign key to organizations.organizationid */;
  title: string;
  description?: string;
  location?: string;
  registrationfee?: any; // type unknown;
  createdat?: string;
  capacity?: number;
  adminid?: string /* foreign key to combined_user_data.id */;
  privacy?: any; // type unknown;
  eventphoto?: string;
  tags?: any; // type unknown;
  eventslug: string;
  organizations?: Organizations;
  combined_user_data?: Combined_user_data;
}

export interface Eventregistrations {
  eventregistrationid: string /* primary key */;
  eventid?: string /* foreign key to events.eventid */;
  organizationmemberid?: string /* foreign key to organizationmembers.organizationmemberid */;
  registrationdate?: string;
  status?: any; // type unknown;
  userid?: string /* foreign key to combined_user_data.id */;
  events?: Events;
  organizationmembers?: Organizationmembers;
  combined_user_data?: Combined_user_data;
}
