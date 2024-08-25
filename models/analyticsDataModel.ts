export class AnalyticsDataModel {
  private day_joined: string;
  private members_joined: number;
  private total_members: number;
  private total_posts: number;
  private total_events: number;
  private event_title: string;
  private total_registrations: number;
  private postid: string;
  private total_comments: number;
  private eventid: string;
  private day_registered: string;
  private registrations_count: number;

  constructor(
    day_joined: string,
    members_joined: number,
    total_members: number,
    total_posts: number,
    total_events: number,
    event_title: string,
    total_registrations: number,
    postid: string,
    total_comments: number,
    eventid: string,
    day_registered: string,
    registrations_count: number
  ) {
    this.day_joined = day_joined;
    this.members_joined = members_joined;
    this.total_members = total_members;
    this.total_posts = total_posts;
    this.total_events = total_events;
    this.event_title = event_title;
    this.total_registrations = total_registrations;
    this.postid = postid;
    this.total_comments = total_comments;
    this.eventid = eventid;
    this.day_registered = day_registered;
    this.registrations_count = registrations_count;
  }

  // Getters and Setters for each attribute
  public getDayJoined(): string {
    return this.day_joined;
  }

  public setDayJoined(day_joined: string): void {
    this.day_joined = day_joined;
  }

  public getMembersJoined(): number {
    return this.members_joined;
  }

  public setMembersJoined(members_joined: number): void {
    this.members_joined = members_joined;
  }

  public getTotalMembers(): number {
    return this.total_members;
  }

  public setTotalMembers(total_members: number): void {
    this.total_members = total_members;
  }

  public getTotalPosts(): number {
    return this.total_posts;
  }

  public setTotalPosts(total_posts: number): void {
    this.total_posts = total_posts;
  }

  public getTotalEvents(): number {
    return this.total_events;
  }

  public setTotalEvents(total_events: number): void {
    this.total_events = total_events;
  }

  public getEventTitle(): string {
    return this.event_title;
  }

  public setEventTitle(event_title: string): void {
    this.event_title = event_title;
  }

  public getTotalRegistrations(): number {
    return this.total_registrations;
  }

  public setTotalRegistrations(total_registrations: number): void {
    this.total_registrations = total_registrations;
  }

  public getPostId(): string {
    return this.postid;
  }

  public setPostId(postid: string): void {
    this.postid = postid;
  }

  public getTotalComments(): number {
    return this.total_comments;
  }

  public setTotalComments(total_comments: number): void {
    this.total_comments = total_comments;
  }

  public getEventId(): string {
    return this.eventid;
  }

  public setEventId(eventid: string): void {
    this.eventid = eventid;
  }

  public getDayRegistered(): string {
    return this.day_registered;
  }

  public setDayRegistered(day_registered: string): void {
    this.day_registered = day_registered;
  }

  public getRegistrationsCount(): number {
    return this.registrations_count;
  }

  public setRegistrationsCount(registrations_count: number): void {
    this.registrations_count = registrations_count;
  }
}