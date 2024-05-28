// models/Notification.ts
export class Notification {
  constructor(
    public notificationId: string,
    public organizationMemberId: string,
    public eventId: string,
    public title: string,
    public eventDateTime: Date,
    public orgName: string,
    public isRead: boolean,
    public userId: string,
    public message: string,
    public createdOn: Date,
    public type: string,
    public path: string
  ) {}
}
