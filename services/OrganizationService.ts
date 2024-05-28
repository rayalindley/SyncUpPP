import { SupabaseClient } from "@supabase/supabase-js";
import { Organization, Organizations } from "../models/Organization";

export class OrganizationService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createOrganization(organization: Organization): Promise<Organization> {
    const { data, error } = await this.supabase
      .from("organizations")
      .insert(organization)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return new Organization(
      data.organizationId,
      data.name,
      data.description,
      data.adminId,
      new Date(data.createdAt),
      data.organizationType,
      data.industry,
      data.organizationSize,
      data.website,
      new Date(data.dateEstablished),
      data.address,
      data.socials,
      data.slug,
      data.photo,
      data.banner
    );
  }

  async getOrganizationById(organizationId: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from("organizations")
      .select("*")
      .eq("organizationId", organizationId)
      .single();

    if (error || !data) return null;

    return new Organization(
      data.organizationId,
      data.name,
      data.description,
      data.adminId,
      new Date(data.createdAt),
      data.organizationType,
      data.industry,
      data.organizationSize,
      data.website,
      new Date(data.dateEstablished),
      data.address,
      data.socials,
      data.slug,
      data.photo,
      data.banner
    );
  }

  async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>
  ): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from("organizations")
      .update(updates)
      .eq("organizationId", organizationId)
      .select("*")
      .single();

    if (error || !data) return null;

    return new Organization(
      data.organizationId,
      data.name,
      data.description,
      data.adminId,
      new Date(data.createdAt),
      data.organizationType,
      data.industry,
      data.organizationSize,
      data.website,
      new Date(data.dateEstablished),
      data.address,
      data.socials,
      data.slug,
      data.photo,
      data.banner
    );
  }

  async deleteOrganization(organizationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("organizations")
      .delete()
      .eq("organizationId", organizationId);

    if (error) throw new Error(error.message);
  }

  async getUserOrganizations(userUuid: string): Promise<Organizations[]> {
    const { data, error } = await this.supabase.rpc("get_user_organizations", {
      user_uuid: userUuid,
    });
    if (error) throw new Error(error.message);
    return data.map(
      (org: any) =>
        new Organizations(
          org.organization_id,
          org.name,
          org.description,
          org.admin_id,
          new Date(org.created_at),
          org.organization_type,
          org.industry,
          org.organization_size,
          org.website,
          new Date(org.date_established),
          org.address,
          org.socials,
          org.slug
        )
    );
  }
}
