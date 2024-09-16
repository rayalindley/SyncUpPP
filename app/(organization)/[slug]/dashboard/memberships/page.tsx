import MembershipTiersClient from "@/components/app/membership_tier_client";
import { fetchMembersBySlug, fetchOrgMemBySlug } from "@/lib/memberships";
import { fetchOrganizationBySlug } from "@/lib/organization";

export default async function MembershipsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const [memberships, members, organization] = await Promise.all([
    fetchOrgMemBySlug(slug),
    fetchMembersBySlug(slug),
    fetchOrganizationBySlug(slug),
  ]);

  if (!organization.data) {
    throw new Error("Organization not found");
  }

  return (
    <div className="mt-8 min-w-[1265px]">
      <MembershipTiersClient
        memberships={memberships ? memberships : []}
        members={members}
        organization={organization.data}
      />
    </div>
  );
}
