// models/Organization.ts
export class Organization {
  constructor(
    public organizationId: string,
    public name: string,
    public description: string,
    public adminId: string,
    public createdAt: Date,
    public organizationType: string,
    public industry: string,
    public organizationSize: string,
    public website: string,
    public dateEstablished: Date,
    public address: Record<string, any>,
    public socials: Record<string, any>,
    public slug: string,
    public photo: string,
    public banner: string
  ) {}
}

export class Organizations {
  constructor(
    public organizationId: string,
    public name: string,
    public description: string,
    public adminId: string,
    public createdAt: Date,
    public organizationType: string,
    public industry: string,
    public organizationSize: string,
    public website: string,
    public dateEstablished: Date,
    public address: Record<string, any>,
    public socials: Record<string, any>,
    public slug: string
  ) {}
}
