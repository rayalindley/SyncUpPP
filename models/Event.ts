// models/Event.ts
export class Event {
  constructor(
    public eventId: string,
    public title: string,
    public description: string,
    public organizationId: string,
    public eventDate: Date,
    public location: string,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}

// models/Event.ts
export class Events {
  constructor(
    public eventId: string,
    public organizationId: string,
    public title: string,
    public description: string,
    public eventDateTime: Date,
    public location: string,
    public registrationFee: number,
    public createdAt: Date,
    public capacity: number,
    public adminId: string,
    public privacy: string,
    public eventPhoto: string,
    public tags: string[],
    public eventSlug: string
  ) {}
}
