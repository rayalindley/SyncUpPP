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

export class OrganizationModel {
  private organizationId: string;
  private name: string;
  private photo: string;
  private banner: string;
  private slug: string;
  private description: string;
  private organizationType: string;
  private industry: string;
  private organizationSize: string;
  private website: string;
  private dateEstablished: Date;
  private address: Address;
  private socials: Socials;

  constructor(
    organizationId: string,
    name: string,
    photo: string,
    banner: string,
    slug: string,
    description: string,
    organizationType: string,
    industry: string,
    organizationSize: string,
    website: string,
    dateEstablished: Date,
    address: Address,
    socials: Socials
  ) {
    this.organizationId = organizationId;
    this.name = name;
    this.photo = photo;
    this.banner = banner;
    this.slug = slug;
    this.description = description;
    this.organizationType = organizationType;
    this.industry = industry;
    this.organizationSize = organizationSize;
    this.website = website;
    this.dateEstablished = dateEstablished;
    this.address = address;
    this.socials = socials;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public setOrganizationId(organizationId: string): void {
    this.organizationId = organizationId;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public getPhoto(): string {
    return this.photo;
  }

  public setPhoto(photo: string): void {
    this.photo = photo;
  }

  public getBanner(): string {
    return this.banner;
  }

  public setBanner(banner: string): void {
    this.banner = banner;
  }

  public getSlug(): string {
    return this.slug;
  }

  public setSlug(slug: string): void {
    this.slug = slug;
  }

  public getDescription(): string {
    return this.description;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public getOrganizationType(): string {
    return this.organizationType;
  }

  public setOrganizationType(organizationType: string): void {
    this.organizationType = organizationType;
  }

  public getIndustry(): string {
    return this.industry;
  }

  public setIndustry(industry: string): void {
    this.industry = industry;
  }

  public getOrganizationSize(): string {
    return this.organizationSize;
  }

  public setOrganizationSize(organizationSize: string): void {
    this.organizationSize = organizationSize;
  }

  public getWebsite(): string {
    return this.website;
  }

  public setWebsite(website: string): void {
    this.website = website;
  }

  public getDateEstablished(): Date {
    return this.dateEstablished;
  }

  public setDateEstablished(dateEstablished: Date): void {
    this.dateEstablished = dateEstablished;
  }

  public getAddress(): Address {
    return this.address;
  }

  public setAddress(address: Address): void {
    this.address = address;
  }

  public getSocials(): Socials {
    return this.socials;
  }

  public setSocials(socials: Socials): void {
    this.socials = socials;
  }
}