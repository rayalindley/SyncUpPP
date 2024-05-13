"use client";
import EventsTable from "@/components/app/EventsTable";
import { createClient, getUser } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const { user } = await getUser();
      const supabase = createClient();
      const { data: eventsData, error } = await supabase.from("events").select("*");

      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(eventsData);
      }
      setLoading(false);
    }

    fetchEvents();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <EventsTable events={events} />
      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
