"use client";
import EventsTableUser from "@/components/app/EventsTableUser";
import Preloader from "@/components/preloader";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/client";
import { Event, Organization } from "@/lib/types";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { slug } = useParams() as { slug: string };
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const userData = await getUser();
      setUser(userData.user);

      const supabase = createClient();
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
  }, [organization]);

  if (loading) {
    return <Preloader />;
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  if (!user) {
    return <Preloader />;
  }

  return (
    <>
      <EventsTableUser organization={organization} events={events} userId={user?.id} />
    </>
  );
}
