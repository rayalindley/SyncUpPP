import AdminAnalyticsDashboard from "@/components/dashboard/AdminAnalyticsDashboard";
import OrganizationsSection from "@/components/dashboard/OrganizationsSection";

import { createClient, getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  const supabase = createClient();
  const { data: organizations, error } = await supabase.rpc("get_user_organizations", {
    user_uuid: user?.id,
  });

  // console.log(organizations, error);

  return (
    <>
      <AdminAnalyticsDashboard userId={user?.id ?? ""} />
      <OrganizationsSection organizations={organizations} />
      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
