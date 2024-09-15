import { fetchOrganizationBySlug } from "@/lib/organization";
import { fetchOrganizationMembersBySlug } from "@/lib/memberships";
import MembersTable from "@/components/memberships/members_table";

export default async function OrganizationMembersPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const [organization, members] = await Promise.all([
    fetchOrganizationBySlug(slug),
    fetchOrganizationMembersBySlug(slug),
  ]);

  if (!organization.data) {
    throw new Error("Organization not found");
  }

  console.log("members", members);

  return (
    <div className="mt-8">
      <MembersTable
        members={members ?? []}
        organization={organization.data}
      />
    </div>
  );
}
