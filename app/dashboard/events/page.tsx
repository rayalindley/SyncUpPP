
import EventsTable from "@/components/app/events_table";
import { fetchAllOrganizations, fetchOrganizationsForUser } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/server";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { redirect } from "next/navigation";

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
    // console.log("events", events);
  } else {
    const organizationsData = await fetchOrganizationsForUser(user.id);
    organizations = organizationsData.data || [];
    const eventsData = await supabase.from("events").select("*").eq("adminid", user.id);
    events = eventsData.data || [];
  }

  return (
    <>
      <EventsTable organizations={organizations} events={events} userId={user.id} />
    </>
  );
}
