import { Organizations } from "./organizations";

export interface Organization_roles {
  role_id: string /* primary key */;
  org_id: string /* foreign key to organizations.organizationid */;
  role: string;
  color?: string;
  deletable: boolean;
  editable?: boolean;
  organizations?: Organizations;
}
