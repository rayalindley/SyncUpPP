import MembershipTiersClient from "@/components/app/membership_tier_client";
import { fetchMembersBySlug, fetchOrgMemBySlug } from "@/lib/memberships";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/server"; // Use the server-side version of Supabase client
import { Organizations } from "@/types/organizations";

export default async function MembershipsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Fetch user details from server-side
  const { user } = await getUser();

  if (!user) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Memberships</h1>
          <p className="text-lg">Please log in to view memberships.</p>
        </div>
      </div>
    );
  }

  // Fetch organization details by slug
  const { data: organization, error: orgError } = await fetchOrganizationBySlug(slug);

  if (orgError || !organization) {
    return <div>Organization not found</div>;
  }

  // Check user permissions to view dashboard
  const hasPermission = await check_permissions(user.id, organization.organizationid, "view_dashboard");

  if (!hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Memberships</h1>
          <p className="text-lg">
            You do not have permission to view memberships for this organization.
          </p>
        </div>
      </div>
    );
  }

  // Fetch memberships and members
  const [memberships, members] = await Promise.all([
    fetchOrgMemBySlug(slug),
    fetchMembersBySlug(slug),
  ]);

  // Render the page with the fetched data
  return (
    <div className="mt-8 ">
      {organization && (
        <MembershipTiersClient
          memberships={memberships ?? []}
          members={members ?? []}
          organization={organization}
        />
      )}
    </div>
  );
}
