// emailModel.ts
export class EmailModel {
  private id: number;
  private sender: string;
  private receiver: string;
  private subject?: string;
  private body?: string;
  private status?: string;
  private dateCreated?: Date;
  private senderId?: string;
  private receiverId?: string;

  constructor(
    id: number,
    sender: string,
    receiver: string,
    subject?: string,
    body?: string,
    status?: string,
    dateCreated?: Date,
    senderId?: string,
    receiverId?: string
  ) {
    this.id = id;
    this.sender = sender;
    this.receiver = receiver;
    this.subject = subject;
    this.body = body;
    this.status = status;
    this.dateCreated = dateCreated;
    this.senderId = senderId;
    this.receiverId = receiverId;
  }

  // Each attribute has corresponding getters and setters. Use those.

  public getId(): number {
    return this.id;
  }

  public setId(id: number): void {
    this.id = id;
  }

  public getSender(): string {
    return this.sender;
  }

  public setSender(sender: string): void {
    this.sender = sender;
  }

  public getReceiver(): string {
    return this.receiver;
  }

  public setReceiver(receiver: string): void {
    this.receiver = receiver;
  }

  public getSubject(): string | undefined {
    return this.subject;
  }

  public setSubject(subject?: string): void {
    this.subject = subject;
  }

  public getBody(): string | undefined {
    return this.body;
  }

  public setBody(body?: string): void {
    this.body = body;
  }

  public getStatus(): string | undefined {
    return this.status;
  }

  public setStatus(status?: string): void {
    this.status = status;
  }

  public getDateCreated(): Date | undefined {
    return this.dateCreated;
  }

  public setDateCreated(dateCreated?: Date): void {
    this.dateCreated = dateCreated;
  }

  public getSenderId(): string | undefined {
    return this.senderId;
  }

  public setSenderId(senderId?: string): void {
    this.senderId = senderId;
  }

  public getReceiverId(): string | undefined {
    return this.receiverId;
  }

  public setReceiverId(receiverId?: string): void {
    this.receiverId = receiverId;
  }
}
