import { Organizations } from "./organizations";

export interface Memberships {
  membershipid: string /* primary key */;
  organizationid?: string /* foreign key to organizations.organizationid */;
  name: string;
  description?: string;
  registrationfee: any; // type unknown;
  features?: any; // type unknown;
  mostPopular?: boolean;
  yearlydiscount?: any; // type unknown;
  organizations?: Organizations;
}
