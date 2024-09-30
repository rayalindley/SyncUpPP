"use client";
import { createClient, getUser } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import RegistrationsTable from "@/components/app/event_registrations_user";
import Preloader from "@/components/preloader";
import { Organization } from "@/types/organization";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { useEffect, useState } from "react";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";

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
}

export default function RegistrationsPageUser() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

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
    if (!user || !organization) return; // Exit early if user or organization is not set

    async function checkUserPermissions() {
      try {
        if (user && organization) {
          const permission = await check_permissions(
            user.id,
            organization.organizationid,
            "view_dashboard" // The permission key for viewing registrations
          );
          setHasPermission(permission);
        } else {
          console.error("User or organization is not set");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
      } finally {
        setLoading(false); // Set loading to false after permission check
      }
    }

    checkUserPermissions();
  }, [user, organization]);

  useEffect(() => {
    if (!organization || !hasPermission) return; // Exit early if organization is not set or no permission

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

  }, [organization, hasPermission]);

  if (loading) {
    return <Preloader />;
  }

  if (!user || !hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Event Registrations</h1>
          <p className="text-lg">
            {user ? "You do not have permission to view registrations for this organization." : "Please log in to view registrations."}
          </p>
          {!user && (
            <button
              onClick={() => router.push("/signin")}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <RegistrationsTable registrations={registrations} userId={user.id} organizationId={organization?.organizationid ?? ''} />
  );
}
