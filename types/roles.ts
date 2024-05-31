import { Organizations } from "./organizations";

export interface Organization_roles {
  role_id: string;
  org_id: string;
  role: string;
  color?: string;
  deletable: boolean;
  editable?: boolean;
  organizations?: Organizations;
}
export interface Member {
  userid: string;
  first_name: string;
  last_name: string;
  profilepicture?: string;
}

export interface Role {
  role_id: string;
  role: string;
  color: string;
  member_count?: number;
  org_id: string;
  deletable: boolean;
  editable?: boolean;
  members?: Member[];
}
