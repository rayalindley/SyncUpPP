import OrganizationsTable from "@/components/app/OrganizationsTable";
import { getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  return (
    <>
      <OrganizationsTable />

      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
