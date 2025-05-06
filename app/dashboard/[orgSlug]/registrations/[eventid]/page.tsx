import { createClient, getUser } from "@/lib/supabase/server";
import { fetchOrganizationsForUser } from "@/lib/organization"; // Import the function
import { redirect } from "next/navigation";
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

export default async function RegistrationsPage() {
  const { user } = await getUser();
  const supabase = createClient();

  if (!user) {
    return redirect("/signin");
  }

  let registrations: Registration[] = [];

  if (!registrations) {
    <Preloader />;
  }

  if (user.role === "superadmin") {
    const registrationsData = await supabase
      .from("eventregistrations_view")
      .select("*");
    registrations = registrationsData.data || [];
  } else {
    // Use the provided function to fetch organizations of the user
    const organizationsData = await fetchOrganizationsForUser(user.id);

    if (organizationsData.error) {
      console.error("Error fetching organizations:", organizationsData.error);
    } else {
      const organizations = organizationsData.data || [];
      const organizationIds = organizations.map(
        (org: { organizationid: string }) => org.organizationid
      );

      // Fetch registrations for events in these organizations
      if (organizationIds.length > 0) {
        const registrationsData = await supabase
          .from("eventregistrations_view")
          .select("*")
          .in("organizationid", organizationIds); // Use 'in' to match any of the organization IDs

        registrations = registrationsData.data || [];
      }
    }
  }

  return <RegistrationsTable registrations={registrations} />;
}
