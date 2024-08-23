// models/OrganizationMember.ts
export class OrganizationMember {
  constructor(
    public organizationMemberId: string,
    public organizationId: string,
    public userId: string,
    public membershipId: string,
    public joinDate: Date,
    public endDate: Date
  ) {}
}
