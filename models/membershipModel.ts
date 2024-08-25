export class MembershipModel {
  private membershipid: string;
  private name: string;
  private description: string;
  private registrationfee: number;
  private organizationid: string;
  private features: any;

  constructor(
    membershipid: string,
    name: string,
    description: string,
    registrationfee: number,
    organizationid: string,
    features: any
  ) {
    this.membershipid = membershipid;
    this.name = name;
    this.description = description;
    this.registrationfee = registrationfee;
    this.organizationid = organizationid;
    this.features = features;
  }

  // Getters and Setters for each attribute
  public getMembershipId(): string {
    return this.membershipid;
  }

  public setMembershipId(membershipid: string): void {
    this.membershipid = membershipid;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public getDescription(): string {
    return this.description;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public getRegistrationFee(): number {
    return this.registrationfee;
  }

  public setRegistrationFee(registrationfee: number): void {
    this.registrationfee = registrationfee;
  }

  public getOrganizationId(): string {
    return this.organizationid;
  }

  public setOrganizationId(organizationid: string): void {
    this.organizationid = organizationid;
  }

  public getFeatures(): any {
    return this.features;
  }

  public setFeatures(features: any): void {
    this.features = features;
  }
}