import EventsTableUser from "@/components/app/events_table_user";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

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

  const { data: organization, error: orgError } = await fetchOrganizationBySlug(params.slug);

  if (orgError || !organization) {
    return <div>Organization not found</div>;
  }

  const hasPermission = await check_permissions(
    user.id,
    organization.organizationid,
    "view_dashboard"
  );

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

  const { data: events, error: eventsError } = await supabase
  .from("events")
  .select("*")
  .eq("organizationid", organization.organizationid)
  .or("is_deleted.eq.false,is_deleted.is.null");

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
    return <div>Error loading events</div>;
  }

  return (
    <div>
      <EventsTableUser
        organization={organization}
        events={events}
        userId={user.id}
        orgSlug={params.slug}
      />
    </div>
  );
}