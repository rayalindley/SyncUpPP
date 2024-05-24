"use client";
import EventsTable from "@/components/app/EventsTable";
import { createClient, getUser } from "@/lib/supabase/client";
import { Organization } from "@/lib/types";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<any[]>([]); // Replace 'any' with your actual event type if available
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const userData = await getUser();
      setUser(userData.user);

      const supabase = createClient();
      const { data: orgs, error: orgError } = await supabase.rpc(
        "get_user_organizations",
        {
          user_uuid: userData.user?.id,
        }
      );

      if (orgError) {
        console.error("Error fetching organizations:", orgError);
        setLoading(false);
        return;
      }

      setOrganizations(orgs);

      // Assuming you have an 'organizationId' field in your events
      const { data: userEvents, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .in(
          "organizationid",
          orgs.map((org: Organization) => org.organization_id)
        );

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
      } else {
        setEvents(userEvents);
        console.log("Fetched events:", userEvents);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <EventsTable organizations={organizations} events={events} />
    </>
  );
}
