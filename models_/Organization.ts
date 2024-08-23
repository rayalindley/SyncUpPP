// @/models/Organization.ts

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  country: string;
}

interface Socials {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

export class Organization {
  constructor(
    public organizationid: string,
    public name: string,
    public photo: string,
    public banner: string,
    public slug: string,
    public description: string,
    public organizationType: string,
    public industry: string,
    public organizationSize: string,
    public website: string,
    public dateEstablished: Date,
    public address: Address,
    public socials: Socials
  ) {}
}
