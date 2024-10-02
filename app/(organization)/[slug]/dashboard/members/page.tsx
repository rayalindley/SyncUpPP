import MembersTable from "@/components/memberships/members_table";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { fetchOrganizationMembersBySlug } from "@/lib/memberships";
import { createClient, getUser } from "@/lib/supabase/server";
import { Organization } from "@/types/organization";

// Define the server-side page function
export default async function OrganizationMembersPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = createClient();

  // Fetch the current user
  const { user } = await getUser();

  if (!user) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Organization Members</h1>
          <p className="text-lg">Please log in to view members.</p>
        </div>
      </div>
    );
  }

  // Fetch organization by slug
  const { data: organization, error: orgError } = await fetchOrganizationBySlug(slug);

  if (orgError || !organization) {
    return <div>Organization not found</div>;
  }

  // Check if the user has permission to view members
  const hasPermission = await check_permissions(user.id, organization.organizationid, "view_dashboard");

  if (!hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Organization Members</h1>
          <p className="text-lg">You do not have permission to view members for this organization.</p>
        </div>
      </div>
    );
  }

  // Fetch members of the organization
  const members = await fetchOrganizationMembersBySlug(slug);

  if (!members || members.length === 0) {
    return <div>No members found for this organization</div>;
  }

  return (
    <div className="mt-8">
      <MembersTable members={members} organization={organization} />
    </div>
  );
}
