import OrganizationsTable from "@/components/app/OrganizationsTable";
import UsersTable from "@/components/app/UsersTable";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  const supabase = createClient();

  const { data: organizations, error } =
    (await supabase.from("organizations").select("*")) ?? [];

  return (
    <>
      <OrganizationsTable organizations={organizations} />

      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
