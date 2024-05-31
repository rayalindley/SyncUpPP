// @/models/Event.ts
export class Event {
  constructor(
    public eventid: string,
    public title: string,
    public description: string,
    public starteventdatetime: Date,
    public endeventdatetime: Date,
    public location: string,
    public capacity: number,
    public registrationfee: number,
    public privacy: string,
    public organizationid: string,
    public eventphoto: string,
    public tags: string[],
    public eventslug: string
  ) {}
}
