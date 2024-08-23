// @/services/OrganizationService.ts

import { createClient } from "@/lib/supabase/server";
import { Organization } from "@/models_/Organization";

export class OrganizationService {
  private supabase = createClient();

  async createOrganization(organization: Organization) {
    try {
      const { data, error } = await this.supabase
        .from("organizations")
        .insert([organization])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async updateOrganization(organizationid: string, organization: Organization) {
    try {
      const { data, error } = await this.supabase
        .from("organizations")
        .update(organization)
        .eq("organizationid", organizationid)
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async fetchOrganizationBySlug(slug: string) {
    try {
      const { data, error } = await this.supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async deleteOrganization(id: string) {
    try {
      const { error } = await this.supabase
        .from("organizations")
        .delete()
        .eq("organizationid", id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async fetchOrganizationsForUser(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from("organizations")
        .select("*")
        .eq("adminid", userId);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async getUserOrganizationInfo(userId: string, organizationid: string) {
    try {
      const { data, error } = await this.supabase
        .rpc("get_user_organization_info", {
          user_id: userId,
          organization_id: organizationid,
        })
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async checkPermissions(userid: string, org_id: string, perm_key: string) {
    try {
      const { data, error } = await this.supabase.rpc("check_org_permissions", {
        p_user_id: userid,
        p_org_id: org_id,
        p_perm_key: perm_key,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }

  async fetchAllOrganizations() {
    try {
      const { data, error } = await this.supabase.from("organizations").select("*");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (e) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        throw new Error(e.message || "An unexpected error occurred");
      } else {
        console.error("Unexpected error:", e);
        throw new Error("An unexpected error occurred");
      }
    }
  }
}
