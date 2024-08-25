export class NotificationModel {
  private notificationId: string;
  private organizationMemberId: string;
  private eventId: string;
  private title: string;
  private eventDateTime: Date;
  private orgName: string;
  private isRead: boolean;
  private userId: string;
  private message: string;
  private createdOn: Date;
  private type: string;
  private path: string;

  constructor(
    notificationId: string,
    organizationMemberId: string,
    eventId: string,
    title: string,
    eventDateTime: Date,
    orgName: string,
    isRead: boolean,
    userId: string,
    message: string,
    createdOn: Date,
    type: string,
    path: string
  ) {
    this.notificationId = notificationId;
    this.organizationMemberId = organizationMemberId;
    this.eventId = eventId;
    this.title = title;
    this.eventDateTime = eventDateTime;
    this.orgName = orgName;
    this.isRead = isRead;
    this.userId = userId;
    this.message = message;
    this.createdOn = createdOn;
    this.type = type;
    this.path = path;
  }

  public getNotificationId(): string {
    return this.notificationId;
  }

  public setNotificationId(notificationId: string): void {
    this.notificationId = notificationId;
  }

  public getOrganizationMemberId(): string {
    return this.organizationMemberId;
  }

  public setOrganizationMemberId(organizationMemberId: string): void {
    this.organizationMemberId = organizationMemberId;
  }

  public getEventId(): string {
    return this.eventId;
  }

  public setEventId(eventId: string): void {
    this.eventId = eventId;
  }

  public getTitle(): string {
    return this.title;
  }

  public setTitle(title: string): void {
    this.title = title;
  }

  public getEventDateTime(): Date {
    return this.eventDateTime;
  }

  public setEventDateTime(eventDateTime: Date): void {
    this.eventDateTime = eventDateTime;
  }

  public getOrgName(): string {
    return this.orgName;
  }

  public setOrgName(orgName: string): void {
    this.orgName = orgName;
  }

  public getIsRead(): boolean {
    return this.isRead;
  }

  public setIsRead(isRead: boolean): void {
    this.isRead = isRead;
  }

  public getUserId(): string {
    return this.userId;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getMessage(): string {
    return this.message;
  }

  public setMessage(message: string): void {
    this.message = message;
  }

  public getCreatedOn(): Date {
    return this.createdOn;
  }

  public setCreatedOn(createdOn: Date): void {
    this.createdOn = createdOn;
  }

  public getType(): string {
    return this.type;
  }

  public setType(type: string): void {
    this.type = type;
  }

  public getPath(): string {
    return this.path;
  }

  public setPath(path: string): void {
    this.path = path;
  }
}