// @/models/Role.ts

import { Member } from "../types/role";

export class Role {
  constructor(
    public role_id: string,
    public org_id: string,
    public role: string,
    public color: string,
    public deletable: boolean,
    public editable?: boolean,
    public members?: Member[]
  ) {}
}
