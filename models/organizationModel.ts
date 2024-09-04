// Define Address and Socials types
export type Address = {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
};

export type Socials = {
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
};

// Define the OrganizationModel class
export class OrganizationModel {
  private selected?: boolean;
  private organizationId?: string;
  private name?: string;
  private description?: string;
  private created_at?: Date;
  private organizationType?: string;
  private organizationSize?: string | number;
  private photo?: string;
  private banner?: string;
  private slug?: string;
  private socials?: string[] | Socials;
  private total_members?: number;
  private total_posts?: number;
  private dateEstablished?: Date;
  private industry?: string;
  private total_events?: number;
  private address?: Address;

  constructor(
    organizationId?: string,
    selected?: boolean,
    name?: string,
    description?: string,
    created_at?: Date,
    organizationType?: string,
    organizationSize?: string | number,
    photo?: string,
    banner?: string,
    slug?: string,
    socials?: string[] | Socials,
    total_members?: number,
    total_posts?: number,
    dateEstablished?: Date,
    industry?: string,
    total_events?: number,
    address?: Address
  ) {
    this.organizationId = organizationId;
    this.selected = selected;
    this.name = name;
    this.description = description;
    this.created_at = created_at;
    this.organizationType = organizationType;
    this.organizationSize = organizationSize;
    this.photo = photo;
    this.banner = banner;
    this.slug = slug;
    this.socials = socials;
    this.total_members = total_members;
    this.total_posts = total_posts;
    this.dateEstablished = dateEstablished;
    this.industry = industry;
    this.total_events = total_events;
    this.address = address;
  }

  // Getter and setter methods for each attribute
  public getSelected(): boolean | undefined {
    return this.selected;
  }

  public setSelected(selected?: boolean): void {
    this.selected = selected;
  }

  public getOrganizationId(): string | undefined {
    return this.organizationId;
  }

  public setOrganizationId(organizationId?: string): void {
    this.organizationId = organizationId;
  }

  public getName(): string | undefined {
    return this.name;
  }

  public setName(name?: string): void {
    this.name = name;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public setDescription(description?: string): void {
    this.description = description;
  }

  public getCreated_at(): Date | undefined {
    return this.created_at;
  }

  public setCreated_at(created_at?: Date): void {
    this.created_at = created_at;
  }

  public getOrganizationType(): string | undefined {
    return this.organizationType;
  }

  public setOrganizationType(organizationType?: string): void {
    this.organizationType = organizationType;
  }

  public getOrganizationSize(): string | number | undefined {
    return this.organizationSize;
  }

  public setOrganizationSize(organizationSize?: string | number): void {
    this.organizationSize = organizationSize;
  }

  public getPhoto(): string | undefined {
    return this.photo;
  }

  public setPhoto(photo?: string): void {
    this.photo = photo;
  }

  public getBanner(): string | undefined {
    return this.banner;
  }

  public setBanner(banner?: string): void {
    this.banner = banner;
  }

  public getSlug(): string | undefined {
    return this.slug;
  }

  public setSlug(slug?: string): void {
    this.slug = slug;
  }

  public getSocials(): string[] | Socials | undefined {
    return this.socials;
  }

  public setSocials(socials?: string[] | Socials): void {
    this.socials = socials;
  }

  public getTotal_members(): number | undefined {
    return this.total_members;
  }

  public setTotal_members(total_members?: number): void {
    this.total_members = total_members;
  }

  public getTotal_posts(): number | undefined {
    return this.total_posts;
  }

  public setTotal_posts(total_posts?: number): void {
    this.total_posts = total_posts;
  }

  public getDateEstablished(): Date | undefined {
    return this.dateEstablished;
  }

  public setDateEstablished(dateEstablished?: Date): void {
    this.dateEstablished = dateEstablished;
  }

  public getIndustry(): string | undefined {
    return this.industry;
  }

  public setIndustry(industry?: string): void {
    this.industry = industry;
  }

  public getTotal_events(): number | undefined {
    return this.total_events;
  }

  public setTotal_events(total_events?: number): void {
    this.total_events = total_events;
  }

  public getAddress(): Address | undefined {
    return this.address;
  }

  public setAddress(address?: Address): void {
    this.address = address;
  }
}
