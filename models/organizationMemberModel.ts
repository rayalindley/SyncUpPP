export class OrganizationMemberModel {
  private organizationMemberId: string;
  private organizationId: string;
  private userId: string;
  private membershipId: string;
  private joinDate: Date;
  private endDate: Date;

  constructor(
    organizationMemberId: string,
    organizationId: string,
    userId: string,
    membershipId: string,
    joinDate: Date,
    endDate: Date
  ) {
    this.organizationMemberId = organizationMemberId;
    this.organizationId = organizationId;
    this.userId = userId;
    this.membershipId = membershipId;
    this.joinDate = joinDate;
    this.endDate = endDate;
  }

  public getOrganizationMemberId(): string {
    return this.organizationMemberId;
  }

  public setOrganizationMemberId(organizationMemberId: string): void {
    this.organizationMemberId = organizationMemberId;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public setOrganizationId(organizationId: string): void {
    this.organizationId = organizationId;
  }

  public getUserId(): string {
    return this.userId;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getMembershipId(): string {
    return this.membershipId;
  }

  public setMembershipId(membershipId: string): void {
    this.membershipId = membershipId;
  }

  public getJoinDate(): Date {
    return this.joinDate;
  }

  public setJoinDate(joinDate: Date): void {
    this.joinDate = joinDate;
  }

  public getEndDate(): Date {
    return this.endDate;
  }

  public setEndDate(endDate: Date): void {
    this.endDate = endDate;
  }
}