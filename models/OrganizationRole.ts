// models/OrganizationRole.ts
export class OrganizationRole {
  constructor(
    public roleId: string,
    public orgId: string,
    public role: string,
    public color: string,
    public deletable: boolean,
    public editable: boolean
  ) {}
}
