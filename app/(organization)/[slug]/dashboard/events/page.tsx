import EventsTableUser from "@/components/app/events_table_user";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/server"; // Server-side Supabase client
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  
  // Fetch the current user
  const { user } = await getUser();

  if (!user) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Events Dashboard</h1>
          <p className="text-lg">Please log in to view this page.</p>
        </div>
      </div>
    );
  }

  // Fetch the organization details by slug
  const { data: organization, error: orgError } = await fetchOrganizationBySlug(params.slug);

  if (orgError || !organization) {
    return <div>Organization not found</div>;
  }

  // Check if the user has permission to view the dashboard
  const hasPermission = await check_permissions(user.id, organization.organizationid, "view_dashboard");

  if (!hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Events Dashboard</h1>
          <p className="text-lg">
            You do not have permission to view or manage events for this organization.
          </p>
        </div>
      </div>
    );
  }

  // Fetch events for the organization
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("organizationid", organization.organizationid);

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
    return <div>Error loading events</div>;
  }

  // Render the events table if everything is fine
  return (
    <div>
      <EventsTableUser organization={organization} events={events} userId={user.id} />
    </div>
  );
}
