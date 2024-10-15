import EventsTable from "@/components/app/events_table";
import { fetchAllOrganizations, fetchOrganizationsForUser, fetchOrganizationsForUserWithViewPermission } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/server";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";

export default async function DashboardPage() {
  const { user } = await getUser();
  const supabase = createClient();

  if (!user) {
    return redirect("/signin");
  }

  let organizations: Organization[] = [];
  let events: Event[] = [];

  if (user.role === "superadmin") {
    const organizationsData = await fetchAllOrganizations();
    organizations = organizationsData || [];
    const { data: eventsData } = await supabase.from("events").select("*");
    events = eventsData || [];
  } else {
    // Fetch organizations that the user is part of
    const organizationsData = await fetchOrganizationsForUserWithViewPermission(user.id);
    organizations = organizationsData.data || [];

    // Extract organization IDs
    const organizationIds = organizations.map(org => org.organizationid);

    // Fetch events associated with any of these organizations
    if (organizationIds.length > 0) {
      const { data: eventsData, error } = await supabase
        .from("events")
        .select("*")
        .in("organizationid", organizationIds); // Use 'in' to match any of the organization IDs

      if (error) {
        console.error("Error fetching events:", error);
      }
      
      events = eventsData || [];
    }
  }

  return (
    <>
    <ToastContainer/>
      <EventsTable organizations={organizations} events={events} userId={user.id} />
    </>
  );
}
