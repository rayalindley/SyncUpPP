import EventsTable from "@/components/app/events_table";
import {
  fetchAllOrganizations,
  fetchOrganizationsForUserWithViewPermission,
} from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/server";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { user } = await getUser();
  const supabase = createClient();

  if (!user) {
    redirect("/signin");
  }

  let organizations: Organization[] = [];
  let events: Event[] = [];

  const isSuperAdmin = user.app_metadata?.role === "superadmin";

  if (isSuperAdmin) {
    organizations = (await fetchAllOrganizations()) ?? [];

    const { data } = await supabase.from("events").select("*");
    events = data ?? [];
  } else {
    const orgResult = await fetchOrganizationsForUserWithViewPermission(user.id);
    organizations = orgResult?.data ?? [];

    const organizationIds = organizations.map(
      (org) => org.organizationid
    );

    if (organizationIds.length > 0) {
      const { data: data, error } = await supabase
      .from("events")
      .select("*")
      .in("organizationid", organizationIds)
      .or("is_deleted.eq.false,is_deleted.is.null");

      if (error) {
        console.error("Error fetching events:", error);
      }

      events = data ?? [];
    }
  }

  return (
    <EventsTable
      organizations={organizations}
      events={events}
      userId={user.id}
    />
  );
}
