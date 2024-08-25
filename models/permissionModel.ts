export class PermissionModel {
  private permId: string;
  private category: string;
  private name: string;
  private description: string;
  private permKey: string;

  constructor(
    permId: string,
    category: string,
    name: string,
    description: string,
    permKey: string
  ) {
    this.permId = permId;
    this.category = category;
    this.name = name;
    this.description = description;
    this.permKey = permKey;
  }

  public getPermId(): string {
    return this.permId;
  }

  public setPermId(permId: string): void {
    this.permId = permId;
  }

  public getCategory(): string {
    return this.category;
  }

  public setCategory(category: string): void {
    this.category = category;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public getDescription(): string {
    return this.description;
  }

  public setDescription(description: string): void {
    this.description = description;
  }

  public getPermKey(): string {
    return this.permKey;
  }

  public setPermKey(permKey: string): void {
    this.permKey = permKey;
  }
}