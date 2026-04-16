import { createClient, getUser } from "@/lib/supabase/server";
import { fetchOrganizationsForUser } from "@/lib/organization";
import { redirect, notFound } from "next/navigation";
import RegistrationsTable from "@/components/app/event_registrations";
import Loader from "@/components/Loader";

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
  id: string;
  attendance: string;
  attendance_updated_at: string;
  has_submitted_feedback: boolean;
  feedback_submitted_at: string;
}

export default async function RegistrationsPage({
  params,
}: {
  params: { orgSlug: string; id: string };
}) {
  const { user } = await getUser();
  const supabase = createClient();

  if (!user) {
    return redirect("/signin");
  }

  const { orgSlug, id } = params;
  let registrations: Registration[] = [];

  if (!registrations) {
    <Loader />;
  }

  if (user.role === "superadmin") {
    const { data } = await supabase
      .from("eventregistrations_view")
      .select("*")
      .eq("id", id);
    registrations = data || [];
  } else {
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
      .eq("id", id)
      .eq("organization_slug", orgSlug);

    registrations = data || [];
  }

  return (
    <div className="p-4">
      <RegistrationsTable registrations={registrations} />
    </div>
  );
}