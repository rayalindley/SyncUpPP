import OrganizationsSection from "@/components/dashboard/OrganizationsSection";
import StatisticsSection from "@/components/dashboard/StatisticsSection";

import { createClient, getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  const supabase = createClient();
  const { data: organizations, error } = await supabase
    .from("organization_summary")
    .select("*")
    .eq("adminid", user?.id);

  return (
    <>
      <StatisticsSection />

      <OrganizationsSection organizations={organizations} />
      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
