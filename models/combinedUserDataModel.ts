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
  private selected: boolean;

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
    selected: boolean = false // Optional parameter with default value
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
    this.selected = selected;
  }

  // Getters and Setters for each attribute
  public getId(): string {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }

  public getRole(): string {
    return this.role;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getFirstName(): string {
    return this.firstName;
  }

  public getLastName(): string {
    return this.lastName;
  }

  public getGender(): string {
    return this.gender;
  }

  public getDateOfBirth(): Date {
    return this.dateOfBirth;
  }
  
  public getDescription(): string {
    return this.description;
  }

  public getCompany(): string {
    return this.company;
  }
  
  public getWebsite(): string {
    return this.website;
  }

  public setSelected(selected: boolean): void {
    this.selected = selected;
  }

  public getSelected(): boolean {
    return this.selected;
  }
}