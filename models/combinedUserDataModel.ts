export class CombinedUserDataModel {
  private id: string;
  private email: string;
  private role: string;
  private createdAt: Date;
  private updatedAt: Date;
  private firstName: string;
  private lastName: string;
  private gender: string;
  private dateOfBirth: Date;
  private description: string;
  private company: string;
  private website: string;
  private updatedat: Date;

  constructor(
    id: string,
    email: string,
    role: string,
    createdAt: Date,
    updatedAt: Date,
    firstName: string,
    lastName: string,
    gender: string,
    dateOfBirth: Date,
    description: string,
    company: string,
    website: string,
    updatedat: Date
  ) {
    this.id = id;
    this.email = email;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.firstName = firstName;
    this.lastName = lastName;
    this.gender = gender;
    this.dateOfBirth = dateOfBirth;
    this.description = description;
    this.company = company;
    this.website = website;
    this.updatedat = updatedat;
  }

  // Getters and Setters for each attribute
  public getId(): string {
    return this.id;
  }

  public setId(id: string): void {
    this.id = id;
  }

  public getEmail(): string {
    return this.email;
  }

  public setEmail(email: string): void {
    this.email = email;
  }

  public getRole(): string {
    return this.role;
  }

  public setRole(role: string): void {
    this.role = role;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public setCreatedAt(createdAt: Date): void {
    this.createdAt = createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public setUpdatedAt(updatedAt: Date): void {
    this.updatedAt = updatedAt;
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

  public getWebsite(): string {
    return this.website;
  }

  public setWebsite(website: string): void {
    this.website = website;
  }

  public getUpdatedAt(): Date {
    return this.updatedat;
  }

  public setUpdatedAt(updatedat: Date): void {
    this.updatedat = updatedat;
  }
}