import RegistrationsTable from "@/components/app/event_registrations_user";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/server"; // Import server-based supabase client
import Preloader from "@/components/preloader";

export default async function RegistrationsPageUser({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  // Fetch the current user
  const { user } = await getUser();

  if (!user) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Event Registrations</h1>
          <p className="text-lg">Please log in to view registrations.</p>
        </div>
      </div>
    );
  }

  // Fetch the organization details by slug
  const { data: organization, error: orgError } = await fetchOrganizationBySlug(params.slug);

  if (orgError || !organization) {
    return <div>Organization not found</div>;
  }

  // Check if the user has permission to view the dashboard and registrations
  const hasViewDashboardPermission = await check_permissions(user.id, organization.organizationid, "view_dashboard");
  const hasViewRegistrationsPermission = await check_permissions(user.id, organization.organizationid, "view_registrations");

  if (!hasViewDashboardPermission || !hasViewRegistrationsPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Event Registrations</h1>
          <p className="text-lg">
            You do not have permission to view registrations for this organization.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the event registrations for this organization
  const { data: registrations, error: registrationsError } = await supabase
    .from("eventregistrations_view")
    .select("*")
    .eq("organization_slug", organization.slug);

  if (registrationsError) {
    console.error("Error fetching registrations:", registrationsError);
    return <div>Error loading registrations</div>;
  }

  // Display the event registrations
  return (
    <div>
      <RegistrationsTable
        registrations={registrations}
        userId={user.id}
        organizationId={organization.organizationid}
      />
    </div>
  );
}
