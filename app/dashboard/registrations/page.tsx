import { createClient, getUser } from "@/lib/supabase/server";
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
}

export default async function RegistrationsPage() {
  const { user } = await getUser();
  const supabase = createClient();

  if (!user) {
    return redirect("/signin");
  }

  let registrations: Registration[] = [];

  if(!registrations) {
    <Preloader />
  }

  if(user.role === "superadmin") {
  const registrationsData = await supabase.from("eventregistrations_view").select("*");
  registrations = registrationsData.data || [];
  } else {
    const registrationsData = await supabase.from("eventregistrations_view").select("*").eq("event_adminid", user.id);
    registrations = registrationsData.data || [];
  }


  return (
    <RegistrationsTable registrations={registrations} />
  );
}
