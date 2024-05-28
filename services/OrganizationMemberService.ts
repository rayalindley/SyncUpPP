// services/OrganizationMemberService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { OrganizationMember } from "../models/OrganizationMember";

export class OrganizationMemberService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createOrganizationMember(
    organizationMember: OrganizationMember
  ): Promise<OrganizationMember> {
    const { data, error } = await this.supabase
      .from("organizationmembers")
      .insert(organizationMember)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new OrganizationMember(
      data.organizationMemberId,
      data.organizationId,
      data.userId,
      data.membershipId,
      new Date(data.joinDate),
      new Date(data.endDate)
    );
  }

  async getOrganizationMemberById(
    organizationMemberId: string
  ): Promise<OrganizationMember | null> {
    const { data, error } = await this.supabase
      .from("organizationmembers")
      .select("*")
      .eq("organizationMemberId", organizationMemberId)
      .single();
    if (error) return null;
    return new OrganizationMember(
      data.organizationMemberId,
      data.organizationId,
      data.userId,
      data.membershipId,
      new Date(data.joinDate),
      new Date(data.endDate)
    );
  }

  async updateOrganizationMember(
    organizationMemberId: string,
    updates: Partial<OrganizationMember>
  ): Promise<OrganizationMember | null> {
    const { data, error } = await this.supabase
      .from("organizationmembers")
      .update(updates)
      .eq("organizationMemberId", organizationMemberId)
      .select()
      .single();
    if (error) return null;
    return new OrganizationMember(
      data.organizationMemberId,
      data.organizationId,
      data.userId,
      data.membershipId,
      new Date(data.joinDate),
      new Date(data.endDate)
    );
  }

  async deleteOrganizationMember(organizationMemberId: string): Promise<void> {
    const { error } = await this.supabase
      .from("organizationmembers")
      .delete()
      .eq("organizationMemberId", organizationMemberId);
    if (error) throw new Error(error.message);
  }
}
