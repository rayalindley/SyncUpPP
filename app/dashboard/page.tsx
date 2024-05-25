import AdminAnalyticsDashboard from "@/components/dashboard/AdminAnalyticsDashboard";
import OrganizationsSection from "@/components/dashboard/OrganizationsSection";

import { createClient, getUser } from "@/lib/supabase/server";
import { Organizations } from "@/lib/types";

interface OrgSummary extends Organizations {
  total_members: number;
  total_posts: number;
  total_events: number;
}

interface OrganizationSectionProps {
  organizations: OrgSummary[];
}

export default async function DashboardPage() {
  const { user } = await getUser();

  const supabase = createClient();
  // const { data: organizations, error } = await supabase.rpc("get_user_organizations", {
  //   user_uuid: user?.id,
  // });

  let organizations: Organizations[];

  if (user?.role === "superadmin") {
    organizations = await supabase
      .from("organization_summary")
      .select("*")
      .then((response) => response.data as Organizations[]);
  } else {
    organizations = await supabase
      .from("organization_summary")
      .select("*")
      .eq("adminid", user?.id)
      .then((response) => response.data as Organizations[]);
  }

  console.log(user);

  return (
    <>
      {user && <AdminAnalyticsDashboard user={user} />}
      <OrganizationsSection organizations={organizations as OrgSummary[]} />
      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
