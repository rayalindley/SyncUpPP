// services/OrganizationRoleService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { OrganizationRole } from "../models/OrganizationRole";

export class OrganizationRoleService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createOrganizationRole(
    organizationRole: OrganizationRole
  ): Promise<OrganizationRole> {
    const { data, error } = await this.supabase
      .from("organization_roles")
      .insert(organizationRole)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new OrganizationRole(
      data.roleId,
      data.orgId,
      data.role,
      data.color,
      data.deletable,
      data.editable
    );
  }

  async getOrganizationRoleById(roleId: string): Promise<OrganizationRole | null> {
    const { data, error } = await this.supabase
      .from("organization_roles")
      .select("*")
      .eq("roleId", roleId)
      .single();
    if (error) return null;
    return new OrganizationRole(
      data.roleId,
      data.orgId,
      data.role,
      data.color,
      data.deletable,
      data.editable
    );
  }

  async updateOrganizationRole(
    roleId: string,
    updates: Partial<OrganizationRole>
  ): Promise<OrganizationRole | null> {
    const { data, error } = await this.supabase
      .from("organization_roles")
      .update(updates)
      .eq("roleId", roleId)
      .select()
      .single();
    if (error) return null;
    return new OrganizationRole(
      data.roleId,
      data.orgId,
      data.role,
      data.color,
      data.deletable,
      data.editable
    );
  }

  async deleteOrganizationRole(roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from("organization_roles")
      .delete()
      .eq("roleId", roleId);
    if (error) throw new Error(error.message);
  }
}
