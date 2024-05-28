// services/RolePermissionService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { RolePermission } from "../models/RolePermission";

export class RolePermissionService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createRolePermission(rolePermission: RolePermission): Promise<RolePermission> {
    const { data, error } = await this.supabase
      .from("role_permissions")
      .insert(rolePermission)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new RolePermission(data.roleId, data.permKey);
  }

  async getRolePermissionById(
    roleId: string,
    permKey: string
  ): Promise<RolePermission | null> {
    const { data, error } = await this.supabase
      .from("role_permissions")
      .select("*")
      .eq("roleId", roleId)
      .eq("permKey", permKey)
      .select()
      .single();
    if (error) return null;
    return new RolePermission(data.roleId, data.permKey);
  }

  async updateRolePermission(
    roleId: string,
    permKey: string,
    updates: Partial<RolePermission>
  ): Promise<RolePermission | null> {
    const { data, error } = await this.supabase
      .from("role_permissions")
      .update(updates)
      .eq("roleId", roleId)
      .eq("permKey", permKey)
      .select()
      .single();
    if (error) return null;
    return new RolePermission(data.roleId, data.permKey);
  }

  async deleteRolePermission(roleId: string, permKey: string): Promise<void> {
    const { error } = await this.supabase
      .from("role_permissions")
      .delete()
      .eq("roleId", roleId)
      .eq("permKey", permKey);
    if (error) throw new Error(error.message);
  }
}
