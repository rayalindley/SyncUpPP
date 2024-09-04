// eventRegistrationModel.ts
export class EventRegistrationModel {
  private eventRegistrationId: string;
  private eventId?: string;
  private organizationMemberId?: string;
  private registrationDate?: Date;
  private status?: string; // Assuming registrationstatus is an ENUM, adapt as necessary
  private userId?: string;

  constructor(
    eventRegistrationId: string,
    eventId?: string,
    organizationMemberId?: string,
    registrationDate?: Date,
    status?: string,
    userId?: string
  ) {
    this.eventRegistrationId = eventRegistrationId;
    this.eventId = eventId;
    this.organizationMemberId = organizationMemberId;
    this.registrationDate = registrationDate;
    this.status = status;
    this.userId = userId;
  }

  // Each attribute has corresponding getters and setters. Use those.

  public getEventRegistrationId(): string {
    return this.eventRegistrationId;
  }

  public setEventRegistrationId(eventRegistrationId: string): void {
    this.eventRegistrationId = eventRegistrationId;
  }

  public getEventId(): string | undefined {
    return this.eventId;
  }

  public setEventId(eventId?: string): void {
    this.eventId = eventId;
  }

  public getOrganizationMemberId(): string | undefined {
    return this.organizationMemberId;
  }

  public setOrganizationMemberId(organizationMemberId?: string): void {
    this.organizationMemberId = organizationMemberId;
  }

  public getRegistrationDate(): Date | undefined {
    return this.registrationDate;
  }

  public setRegistrationDate(registrationDate?: Date): void {
    this.registrationDate = registrationDate;
  }

  public getStatus(): string | undefined {
    return this.status;
  }

  public setStatus(status?: string): void {
    this.status = status;
  }

  public getUserId(): string | undefined {
    return this.userId;
  }

  public setUserId(userId?: string): void {
    this.userId = userId;
  }
}
