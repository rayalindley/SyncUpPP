// @/services/MembershipService.ts

import { createClient } from "@/lib/supabase/server";
import { Membership } from "@/models/Membership";

export class MembershipService {
  private supabase = createClient();

  async getMemberships(organizationid: string) {
    try {
      const { data: memberships, error } = await this.supabase
        .from("memberships")
        .select("*")
        .eq("organizationid", organizationid);

      if (error) {
        throw new Error(error.message);
      }

      return memberships;
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

  async getOrgMem(organizationid: string) {
    try {
      const { data: org_memberships, error } = await this.supabase
        .from("organization_memberships")
        .select("*")
        .eq("organizationid", organizationid);

      if (error) {
        throw new Error(error.message);
      }

      return org_memberships;
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

  async deleteMembership(membershipid: string) {
    try {
      const { error } = await this.supabase
        .from("memberships")
        .delete()
        .eq("membershipid", membershipid);

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

  async getMembers(membershipid: string) {
    try {
      const { data: org_members, error } = await this.supabase
        .from("user_membership_info")
        .select("*")
        .eq("membershipid", membershipid);

      if (error) {
        throw new Error(error.message);
      }

      return org_members;
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

  async fetchMembershipById(membershipid: string) {
    try {
      const { data, error } = await this.supabase
        .from("memberships")
        .select("*")
        .eq("membershipid", membershipid)
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

  async insertMembership(membership: Membership) {
    try {
      const { data, error } = await this.supabase
        .from("memberships")
        .insert([membership])
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

  async updateMembership(membershipid: string, membership: Membership) {
    try {
      const { data, error } = await this.supabase
        .from("memberships")
        .update(membership)
        .eq("membershipid", membershipid)
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

  async fetchOrgMemBySlug(slug: string) {
    try {
      const { data: org_memberships, error } = await this.supabase
        .from("organization_memberships")
        .select("*")
        .eq("slug", slug);

      if (error) {
        throw new Error(error.message);
      }

      return org_memberships;
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

  async fetchMembersBySlug(slug: string) {
    try {
      const { data: org, error: orgError } = await this.supabase
        .from("organizations")
        .select("organizationid")
        .eq("slug", slug)
        .single();

      if (orgError) {
        throw new Error(orgError.message);
      }

      const { data: members, error: memberError } = await this.supabase
        .from("user_membership_info")
        .select("*")
        .eq("organizationid", org.organizationid);

      if (memberError) {
        throw new Error(memberError.message);
      }

      return members;
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
