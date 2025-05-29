import EventsTable from "@/components/app/events_table";
import FeedbackTable from "@/components/app/view_feedback";
import { fetchAllOrganizations, fetchOrganizationsForUser, fetchOrganizationsForUserWithViewPermission } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/server";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { useParams, useRouter } from "next/navigation";


export default async function ViewFeedbackPage(
  { params }: { params: { slug: string}}
) {
  const { user } = await getUser();
  const slug = params.slug;
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
    const organizationsData = await fetchOrganizationsForUserWithViewPermission(user.id);
    organizations = organizationsData.data || [];

    const organizationIds = organizations.map(org => org.organizationid);

    if (organizationIds.length > 0) {
      const { data: eventsData, error } = await supabase
        .from("events")
        .select("*")
        .in("organizationid", organizationIds);

      if (error) {
        console.error("Error fetching events:", error);
      }
      
      events = eventsData || [];
    }
  }

  return (
    <>
    <ToastContainer/>
      {/* <EventsTable organizations={organizations} events={events} userId={user.id} /> */}
      
      <FeedbackTable eventSlug={slug} userId={user.id}/>
    </>
  );
}
