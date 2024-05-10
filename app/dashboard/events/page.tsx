import EventsTable from "@/components/app/EventsTable";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  const supabase = createClient();

  const { data: events, error } = (await supabase.from("events").select("*")) ?? [];

  return (
    <>
      <EventsTable events={events} />

      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
