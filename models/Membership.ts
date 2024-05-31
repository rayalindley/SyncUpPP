// @/models/Membership.ts

export class Membership {
  constructor(
    public membershipid: string,
    public name: string,
    public description: string,
    public registrationfee: number,
    public organizationid: string,
    public features: any
  ) {}

  // Add any business logic or validation methods here if needed
}
