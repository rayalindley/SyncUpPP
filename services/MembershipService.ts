// services/MembershipService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Membership } from "../models/Membership";

export class MembershipService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createMembership(membership: Membership): Promise<Membership> {
    const { data, error } = await this.supabase
      .from("memberships")
      .insert(membership)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new Membership(
      data.membershipId,
      data.organizationId,
      data.name,
      data.description,
      data.registrationFee,
      data.features,
      data.mostPopular,
      data.yearlyDiscount
    );
  }

  async getMembershipById(membershipId: string): Promise<Membership | null> {
    const { data, error } = await this.supabase
      .from("memberships")
      .select("*")
      .eq("membershipId", membershipId)
      .select()
      .single();
    if (error) return null;
    return new Membership(
      data.membershipId,
      data.organizationId,
      data.name,
      data.description,
      data.registrationFee,
      data.features,
      data.mostPopular,
      data.yearlyDiscount
    );
  }

  async updateMembership(
    membershipId: string,
    updates: Partial<Membership>
  ): Promise<Membership | null> {
    const { data, error } = await this.supabase
      .from("memberships")
      .update(updates)
      .eq("membershipId", membershipId)
      .select()
      .single();
    if (error) return null;
    return new Membership(
      data.membershipId,
      data.organizationId,
      data.name,
      data.description,
      data.registrationFee,
      data.features,
      data.mostPopular,
      data.yearlyDiscount
    );
  }

  async deleteMembership(membershipId: string): Promise<void> {
    const { error } = await this.supabase
      .from("memberships")
      .delete()
      .eq("membershipId", membershipId);
    if (error) throw new Error(error.message);
  }
}
