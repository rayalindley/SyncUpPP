import OrganizationsTable from "@/components/app/organizations_table";
import UsersTable from "@/components/app/users_table";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  const supabase = createClient();

  const { data: organizations, error } =
    (await supabase.from("organizations").select("*")) ?? [];

  return (
    <>
      <OrganizationsTable organizations={organizations || []} />

      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
