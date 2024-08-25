import { Member } from "../types/roles";

export class RoleModel {
  private roleId: string;
  private orgId: string;
  private role: string;
  private color: string;
  private deletable: boolean;
  private editable?: boolean;
  private members?: Member[];

  constructor(
    roleId: string,
    orgId: string,
    role: string,
    color: string,
    deletable: boolean,
    editable?: boolean,
    members?: Member[]
  ) {
    this.roleId = roleId;
    this.orgId = orgId;
    this.role = role;
    this.color = color;
    this.deletable = deletable;
    this.editable = editable;
    this.members = members;
  }

  public getRoleId(): string {
    return this.roleId;
  }

  public setRoleId(roleId: string): void {
    this.roleId = roleId;
  }

  public getOrgId(): string {
    return this.orgId;
  }

  public setOrgId(orgId: string): void {
    this.orgId = orgId;
  }

  public getRole(): string {
    return this.role;
  }

  public setRole(role: string): void {
    this.role = role;
  }

  public getColor(): string {
    return this.color;
  }

  public setColor(color: string): void {
    this.color = color;
  }

  public getDeletable(): boolean {
    return this.deletable;
  }

  public setDeletable(deletable: boolean): void {
    this.deletable = deletable;
  }

  public getEditable(): boolean | undefined {
    return this.editable;
  }

  public setEditable(editable?: boolean): void {
    this.editable = editable;
  }

  public getMembers(): Member[] | undefined {
    return this.members;
  }

  public setMembers(members?: Member[]): void {
    this.members = members;
  }
}