// models/Membership.ts
export class Membership {
  constructor(
    public membershipId: string,
    public organizationId: string,
    public name: string,
    public description: string,
    public registrationFee: number,
    public features: string[],
    public mostPopular: boolean,
    public yearlyDiscount: number
  ) {}
}
