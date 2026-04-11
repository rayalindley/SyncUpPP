// models/EventRegistration.ts
export class EventRegistration {
  constructor(
    public eventRegistrationId: string,
    public id: string,
    public organizationMemberId: string,
    public registrationDate: Date,
    public status: string,
    public userId: string
  ) {}
}
