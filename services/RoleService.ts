// @/services/RoleService.ts

import { createClient } from "../lib/supabase/server";
import { Role } from "../models/Role";
import { Member } from "../types/role";

export class RoleService {
  private supabase = createClient();

  async fetchRoles(org_id: string) {
    try {
      const { data, error } = await this.supabase
        .from("organization_roles")
        .select("*")
        .eq("org_id", org_id)
        .order("created_at", { ascending: false });

      if (error) {
        return { data: null, error: { message: error.message } };
      }
      return { data, error: null };
    } catch (e: any) {
      console.error("Unexpected error:", e);
      return {
        data: null,
        error: { message: e.message || "An unexpected error occurred" },
      };
    }
  }

  async insertRole(role: Role) {
    try {
      const insertValues = {
        org_id: role.org_id,
        role: role.role,
        color: role.color,
        deletable: role.deletable,
        editable: role.editable,
      };

      const { data, error } = await this.supabase
        .from("organization_roles")
        .insert([insertValues])
        .select()
        .single();

      if (!error) {
        return { data, error: null };
      } else {
        console.error("Error inserting role:", error.message);
        return { data: null, error: { message: error.message } };
      }
    } catch (e: any) {
      console.error("Unexpected error:", e);
      return {
        data: null,
        error: { message: e.message || "An unexpected error occurred" },
      };
    }
  }

  async updateRole(role: Role) {
    try {
      const updateFields: Partial<Role> = {
        role: role.role,
        color: role.color,
      };

      const { data, error } = await this.supabase
        .from("organization_roles")
        .update(updateFields)
        .eq("role_id", role.role_id)
        .select()
        .single();

      if (!error) {
        return { data, error: null };
      } else {
        return { data: null, error: { message: error.message } };
      }
    } catch (e: any) {
      console.error("Unexpected error:", e);
      return {
        data: null,
        error: { message: e.message || "An unexpected error occurred" },
      };
    }
  }

  async deleteRole(role_id: string) {
    try {
      const { data, error } = await this.supabase
        .from("organization_roles")
        .delete()
        .eq("role_id", role_id);

      if (!error) {
        return { data, error: null };
      } else {
        return { data: null, error: { message: error.message } };
      }
    } catch (e: any) {
      console.error("Unexpected error:", e);
      return {
        data: null,
        error: { message: e.message || "An unexpected error occurred" },
      };
    }
  }

  async fetchRoleMembers(role_id: string): Promise<Member[]> {
    try {
      const { data, error } = await this.supabase
        .from("organizationmembers")
        .select("userid")
        .eq("roleid", role_id);

      if (error) {
        console.error("Error fetching role members:", error.message);
        return [];
      }

      const userIds = data.map((item: { userid: string }) => item.userid);
      const { data: userProfiles, error: profileError } = await this.supabase
        .from("userprofiles")
        .select("*")
        .in("userid", userIds);

      if (profileError) {
        console.error(profileError);
        return [];
      }
      return userProfiles;
    } catch (e: any) {
      console.error("Unexpected error:", e);
      return [];
    }
  }

  async addMemberToRole(userId: string, role_id: string, org_id: string) {
    try {
      const { data, error } = await this.supabase
        .from("organizationmembers")
        .update({ roleid: role_id })
        .eq("userid", userId)
        .eq("organizationid", org_id);

      if (error) {
        console.error("Error adding member to role:", error.message);
        return { data: null, error: { message: error.message } };
      }
      return { data, error: null };
    } catch (e: any) {
      console.error("Unexpected error:", e);
      return {
        data: null,
        error: { message: e.message || "An unexpected error occurred" },
      };
    }
  }

  async removeMemberFromRole(userId: string, org_id: string) {
    try {
      const { data, error } = await this.supabase
        .from("organizationmembers")
        .update({ roleid: null })
        .eq("userid", userId)
        .eq("organizationid", org_id);

      if (error) {
        console.error("Error removing member from role:", error.message);
        return { data: null, error: { message: error.message } };
      }
      return { data, error: null };
    } catch (e: any) {
      console.error("Unexpected error:", e);
      return {
        data: null,
        error: { message: e.message || "An unexpected error occurred" },
      };
    }
  }
}
