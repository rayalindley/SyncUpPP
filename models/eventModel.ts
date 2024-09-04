export class EventModel {
  private id: string;
  private eventid: string;
  private eventphoto: string;
  private title: string;
  private description: string;
  private registrationfee: number;
  private starteventdatetime: Date;
  private endeventdatetime: Date;
  private location: string;
  private capacity: number;
  private organizationid: string;
  private eventslug: string;
  private imageUrl?: string; // Optional
  private tags?: string[];   // Optional
  private privacy: string;
  private createdat?: Date;  // Optional
  private selected?: string | boolean; // Optional

  constructor(
    id: string,
    eventid: string,
    eventphoto: string,
    title: string,
    description: string,
    registrationfee: number,
    starteventdatetime: Date,
    endeventdatetime: Date,
    location: string,
    capacity: number,
    organizationid: string,
    eventslug: string,
    privacy: string,
    imageUrl?: string,       // Optional
    tags?: string[],         // Optional
    createdat?: Date,        // Optional
    selected?: string | boolean // Optional
  ) {
    this.id = id;
    this.eventid = eventid;
    this.eventphoto = eventphoto;
    this.title = title;
    this.description = description;
    this.registrationfee = registrationfee;
    this.starteventdatetime = starteventdatetime;
    this.endeventdatetime = endeventdatetime;
    this.location = location;
    this.capacity = capacity;
    this.organizationid = organizationid;
    this.eventslug = eventslug;
    this.privacy = privacy;
    this.imageUrl = imageUrl;
    this.tags = tags;
    this.createdat = createdat;
    this.selected = selected;
  }

  // Getters and Setters for each attribute

  public getId(): string {
    return this.id;
  }

  public setId(id: string): void {
    this.id = id;
  }

  public getEventId(): string {
    return this.eventid;
  }

  public setEventId(eventid: string): void {
    this.eventid = eventid;
  }

  public getEventPhoto(): string {
    return this.eventphoto;
  }

  public setEventPhoto(eventphoto: string): void {
    this.eventphoto = eventphoto;
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

  public getRegistrationFee(): number {
    return this.registrationfee;
  }

  public setRegistrationFee(registrationfee: number): void {
    this.registrationfee = registrationfee;
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

  public setEndEventDateTime(endeventdatetime: Date): void {
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

  public getOrganizationId(): string {
    return this.organizationid;
  }

  public setOrganizationId(organizationid: string): void {
    this.organizationid = organizationid;
  }

  public getEventSlug(): string {
    return this.eventslug;
  }

  public setEventSlug(eventslug: string): void {
    this.eventslug = eventslug;
  }

  public getImageUrl(): string | undefined {
    return this.imageUrl;
  }

  public setImageUrl(imageUrl?: string): void {
    this.imageUrl = imageUrl;
  }

  public getTags(): string[] | undefined {
    return this.tags;
  }

  public setTags(tags?: string[]): void {
    this.tags = tags;
  }

  public getPrivacy(): string {
    return this.privacy;
  }

  public setPrivacy(privacy: string): void {
    this.privacy = privacy;
  }

  public getCreatedAt(): Date | undefined {
    return this.createdat;
  }

  public setCreatedAt(createdat?: Date): void {
    this.createdat = createdat;
  }

  public getSelected(): string | boolean | undefined {
    return this.selected;
  }

  public setSelected(selected?: string | boolean): void {
    this.selected = selected;
  }
}
