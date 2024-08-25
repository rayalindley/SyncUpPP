export class RolePermissionModel {
  private roleId: string;
  private permKey: string;

  constructor(roleId: string, permKey: string) {
    this.roleId = roleId;
    this.permKey = permKey;
  }

  // Getters and Setters for each attribute
  public getRoleId(): string {
    return this.roleId;
  }

  public setRoleId(roleId: string): void {
    this.roleId = roleId;
  }

  public getPermKey(): string {
    return this.permKey;
  }

  public setPermKey(permKey: string): void {
    this.permKey = permKey;
  }
}