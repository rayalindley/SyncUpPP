// models/EventRegistration.ts
export class EventRegistration {
  constructor(
    public eventRegistrationId: string,
    public eventId: string,
    public organizationMemberId: string,
    public registrationDate: Date,
    public status: string,
    public userId: string
  ) {}
}
