"use client";
import EventsTable from "@/components/app/EventsTable";
import { createClient, getUser } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [events, setEvents] = useState([]);
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
          orgs.map((org) => org.organization_id)
        );

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
      } else {
        setEvents(userEvents);
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
