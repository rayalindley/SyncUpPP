"use client";
import { createClient, getUser } from "@/lib/supabase/client";
import { useParams, redirect } from "next/navigation";
import RegistrationsTable from "@/components/app/event_registrations_user";
import Preloader from "@/components/preloader";
import { Organization } from "@/types/organization";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { use, useEffect, useState } from "react";
import { fetchOrganizationBySlug } from "@/lib/organization";

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

export default function RegistrationsPageUser() {
  const { slug } = useParams() as { slug: string };
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);


  useEffect(() => {
    async function fetchData() {
      const userData = await getUser();
      setUser(userData.user);

      try {
        const { data, error } = await fetchOrganizationBySlug(slug);
        if (error) {
          console.error("Error fetching organization:", error);
          setLoading(false);
          return;
        } else {
          setOrganization(data);
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        setLoading(false);
        return;
      }
    }

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (!organization) return; // Exit early if organization is not set

    async function fetchRegistrations() {
      const supabase = createClient();

      try {
        const { data: userRegistrations, error: registrationsError } = await supabase
          .from("eventregistrations_view")
          .select("*")
          .eq("organization_slug", organization?.slug);

        if (registrationsError) {
          console.error("Error fetching registrations:", registrationsError);
        } else {
          setRegistrations(userRegistrations);
        }
      } catch (error) {
        console.error("Error fetching registrations:", error);
        setLoading(false);
        return;
      }
    }

    fetchRegistrations();

  }, [organization]);

  if (!organization) {
    return <Preloader />;
  }



  if (!user) {
    return <Preloader />;
  }


  return (
    <RegistrationsTable registrations={registrations} />
  );
}
