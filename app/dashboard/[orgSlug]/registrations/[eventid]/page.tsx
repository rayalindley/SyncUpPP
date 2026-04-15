import { createClient, getUser } from "@/lib/supabase/server";
import { fetchOrganizationsForUser } from "@/lib/organization";
import { redirect, notFound } from "next/navigation";
import RegistrationsTable from "@/components/app/event_registrations";

interface Registration {
  id: string;
  eventid: string;
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
  organizationid: string;
  attendance: string;
  attendance_updated_at: string;
  has_submitted_feedback: boolean;
  feedback_submitted_at: string;
}

export default async function RegistrationsPage({
  params,
}: {
  params: { orgSlug: string; eventid: string };
}) {
  const { user } = await getUser();
  const supabase = createClient();

  if (!user) {
    return redirect("/signin");
  }

  const { orgSlug, eventid } = params;
  let registrations: Registration[] = [];

  if (user.role === "superadmin") {
    const { data, error } = await supabase
      .from("eventregistrations_view")
      .select("*")
      .eq("eventid", eventid);

    if (error) {
      console.error("Error fetching registrations (superadmin):", JSON.stringify(error, null, 2));
      return <div className="p-4">Error loading registrations.</div>;
    }

    registrations = (data || []).map((r: any) => ({
      ...r,
      id: r.id ?? r.eventid,
    }));
  } else {
    const orgsData = await fetchOrganizationsForUser(user.id);

    if (orgsData.error) {
      console.error("Error fetching organizations:", orgsData.error);
      return notFound();
    }

    const userOrgs = orgsData.data || [];
    const allowed = userOrgs.find((o: any) => o.slug === orgSlug);

    if (!allowed) return notFound();

    const { data, error } = await supabase
      .from("eventregistrations_view")
      .select("*")
      .eq("organization_slug", orgSlug)
      .eq("eventid", eventid);

    if (error) {
      console.error("Error fetching registrations:", JSON.stringify(error, null, 2));
      return <div className="p-4">Error loading registrations.</div>;
    }

    registrations = (data || []).map((r: any) => ({
      ...r,
      id: r.id ?? r.eventid,
    }));
  }

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-base font-semibold leading-6 text-light">
          Event Registrations
        </h1>
        <p className="mt-2 text-sm text-light">
          A list of all event registrations.
        </p>
      </div>
      <RegistrationsTable registrations={registrations} />
    </div>
  );
}