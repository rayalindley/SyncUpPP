export class EventModel {
  private eventid: string;
  private title: string;
  private description: string;
  private starteventdatetime: Date;
  private endeventdatetime: Date;
  private location: string;
  private capacity: number;
  private registrationfee: number;
  private privacy: string;
  private organizationid: string;
  private eventphoto: string;
  private tags: string[];
  private eventslug: string;

  constructor(
    eventid: string,
    title: string,
    description: string,
    starteventdatetime: Date,
    endeventdatetime: Date,
    location: string,
    capacity: number,
    registrationfee: number,
    privacy: string,
    organizationid: string,
    eventphoto: string,
    tags: string[],
    eventslug: string
  ) {
    this.eventid = eventid;
    this.title = title;
    this.description = description;
    this.starteventdatetime = starteventdatetime;
    this.endeventdatetime = endeventdatetime;
    this.location = location;
    this.capacity = capacity;
    this.registrationfee = registrationfee;
    this.privacy = privacy;
    this.organizationid = organizationid;
    this.eventphoto = eventphoto;
    this.tags = tags;
    this.eventslug = eventslug;
  }

  // Getters and Setters for each attribute
  public getEventId(): string {
    return this.eventid;
  }

  public setEventId(eventid: string): void {
    this.eventid = eventid;
  }

  public getTitle(): string {
    return this.title;
  }

  public setTitle(title: string): void {
    this.title = title;
  }

  public getDescription(): string {
    return this.description;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public getStartEventDateTime(): Date {
    return this.starteventdatetime;
  }

  public setStartEventDateTime(starteventdatetime: Date): void {
    this.starteventdatetime = starteventdatetime;
  }

  public getEndEventDateTime(): Date {
    return this.endeventdatetime;
  }

  public setEndEventDateTime(ende

ventdatetime: Date): void {
    this.endeventdatetime = endeventdatetime;
  }

  public getLocation(): string {
    return this.location;
  }

  public setLocation(location: string): void {
    this.location = location;
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public setCapacity(capacity: number): void {
    this.capacity = capacity;
  }

  public getRegistrationFee(): number {
    return this.registrationfee;
  }

  public setRegistrationFee(registrationfee: number): void {
    this.registrationfee = registrationfee;
  }

  public getPrivacy(): string {
    return this.privacy;
  }

  public setPrivacy(privacy: string): void {
    this.privacy = privacy;
  }

  public getOrganizationId(): string {
    return this.organizationid;
  }

  public setOrganizationId(organizationid: string): void {
    this.organizationid = organizationid;
  }

  public getEventPhoto(): string {
    return this.eventphoto;
  }

  public setEventPhoto(eventphoto: string): void {
    this.eventphoto = eventphoto;
  }

  public getTags(): string[] {
    return this.tags;
  }

  public setTags(tags: string[]): void {
    this.tags = tags;
  }

  public getEventSlug(): string {
    return this.eventslug;
  }

  public setEventSlug(eventslug: string): void {
    this.eventslug = eventslug;
  }
}