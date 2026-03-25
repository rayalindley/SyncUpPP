import { createClient, getUser } from "@/lib/supabase/server";
import { fetchOrganizationsForUser } from "@/lib/organization"; // Import the function
import { redirect, notFound } from "next/navigation";
import RegistrationsTable from "@/components/app/event_registrations";
import Preloader from "@/components/preloader";

interface Registration {
  eventregistrationid: string;
  first_name: string;
  last_name: string;
  email: string;
  event_name: string;
  organization_name: string;
  registrationdate: string;
  status: string;
  adminid: string;
  organization_slug: string;
  eventid: string;
  attendance: string;
  attendance_updated_at: string;
  has_submitted_feedback: boolean;
  feedback_submitted_at: string;
}

export default async function RegistrationsPage({
  params,
}: {
  params: { orgSlug: string; eventId: string};
}) {
  const { user } = await getUser();
  const supabase = createClient();

  if (!user) {
    return redirect("/signin");
  }

  const { orgSlug, eventId} = params;
  let registrations: Registration[] = [];

  if (!registrations) {
    <Preloader />;
  }

  if (user.role === "superadmin") {
    const { data } = await supabase
      .from("eventregistrations_view")
      .select("*")
      .eq("eventid", eventId);
    registrations = data || [];
  } else {
    // Verify user belongs to the org based on slug
    const orgsData = await fetchOrganizationsForUser(user.id);

    if (orgsData.error) {
      console.error("Error fetching organizations:", orgsData.error);
      return notFound();
    }

    const userOrgs = orgsData.data || [];
    const allowed = userOrgs.find((o: any) => o.slug === orgSlug);

    if (!allowed) return notFound();

    const { data } = await supabase
      .from("eventregistrations_view")
      .select("*")
      .eq("eventid", eventId)
      .eq("organization_slug", orgSlug);

    registrations = data || [];
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Event Registrations</h1>
      <RegistrationsTable registrations={registrations} />
    </div>
  );
}