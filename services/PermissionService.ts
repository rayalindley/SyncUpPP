// services/PermissionService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Permission } from "../models/Permission";

export class PermissionService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createPermission(permission: Permission): Promise<Permission> {
    const { data, error } = await this.supabase
      .from("permissions")
      .insert(permission)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new Permission(
      data.permId,
      data.category,
      data.name,
      data.description,
      data.permKey
    );
  }

  async getPermissionById(permId: string): Promise<Permission | null> {
    const { data, error } = await this.supabase
      .from("permissions")
      .select("*")
      .eq("permId", permId)
      .single();
    if (error) return null;
    return new Permission(
      data.permId,
      data.category,
      data.name,
      data.description,
      data.permKey
    );
  }

  async updatePermission(
    permId: string,
    updates: Partial<Permission>
  ): Promise<Permission | null> {
    const { data, error } = await this.supabase
      .from("permissions")
      .update(updates)
      .eq("permId", permId)
      .select()
      .single();
    if (error) return null;
    return new Permission(
      data.permId,
      data.category,
      data.name,
      data.description,
      data.permKey
    );
  }

  async deletePermission(permId: string): Promise<void> {
    const { error } = await this.supabase
      .from("permissions")
      .delete()
      .eq("permId", permId);
    if (error) throw new Error(error.message);
  }

  async checkOrgPermissions(
    userId: string,
    orgId: string,
    permKey: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc("check_org_permissions", {
      p_user_id: userId,
      p_org_id: orgId,
      p_perm_key: permKey,
    });
    if (error) throw new Error(error.message);
    return data;
  }
}
