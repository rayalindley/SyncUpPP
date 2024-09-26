"use client";
import EventsTableUser from "@/components/app/events_table_user";
import Preloader from "@/components/preloader";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/client";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
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
            "view_dashboard" // The permission key for editing events
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

    async function fetchEvents() {
      const supabase = createClient();
      try {
        const { data: userEvents, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("organizationid", organization?.organizationid);

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
        } else {
          setEvents(userEvents);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [organization, hasPermission]);

  if (loading) {
    return <Preloader />;
  }

  if (!user || !hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Events Dashboard</h1>
          <p className="text-lg">
            {user
              ? "You do not have permission to view or manage events for this organization."
              : "Please log in to view this page."}
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
    <>
      <EventsTableUser organization={organization!} events={events} userId={user?.id} />
    </>
  );
}
