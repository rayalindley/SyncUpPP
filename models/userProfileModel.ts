export class UserProfileModel {
  private userId: string;
  private firstName: string;
  private lastName: string;
  private gender: string;
  private dateOfBirth: Date;
  private description: string;
  private company: string;
  private profilePicture: string;
  private website: string;
  private updatedAt: Date;
  private id: number;

  constructor(
    userId: string,
    firstName: string,
    lastName: string,
    gender: string,
    dateOfBirth: Date,
    description: string,
    company: string,
    profilePicture: string,
    website: string,
    updatedAt: Date,
    id: number
  ) {
    this.userId = userId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.gender = gender;
    this.dateOfBirth = dateOfBirth;
    this.description = description;
    this.company = company;
    this.profilePicture = profilePicture;
    this.website = website;
    this.updatedAt = updatedAt;
    this.id = id;
  }

  public getUserId(): string {
    return this.userId;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getFirstName(): string {
    return this.firstName;
  }

  public setFirstName(firstName: string): void {
    this.firstName = firstName;
  }

  public getLastName(): string {
    return this.lastName;
  }

  public setLastName(lastName: string): void {
    this.lastName = lastName;
  }

  public getGender(): string {
    return this.gender;
  }

  public setGender(gender: string): void {
    this.gender = gender;
  }

  public getDateOfBirth(): Date {
    return this.dateOfBirth;
  }

  public setDateOfBirth(dateOfBirth: Date): void {
    this.dateOfBirth = dateOfBirth;
  }

  public getDescription(): string {
    return this.description;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public getCompany(): string {
    return this.company;
  }

  public setCompany(company: string): void {
    this.company = company;
  }

  public getProfilePicture(): string {
    return this.profilePicture;
  }

  public setProfilePicture(profilePicture: string): void {
    this.profilePicture = profilePicture;
  }

  public getWebsite(): string {
    return this.website;
  }

  public setWebsite(website: string): void {
    this.website = website;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public setUpdatedAt(updatedAt: Date): void {
    this.updatedAt = updatedAt;
  }

  public getId(): number {
    return this.id;
  }

  public setId(id: number): void {


    this.id = id;
  }
}