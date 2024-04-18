import OrganizationsSection from "@/components/dashboard/OrganizationsSection";
import StatisticsSection from "@/components/dashboard/StatisticsSection";
import { getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  return (
    <>
      <StatisticsSection />

      <OrganizationsSection />
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  );
}
