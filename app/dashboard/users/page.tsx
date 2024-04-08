import StatisticSection from "@/components/app/Statistics";
import UsersTable from "@/components/app/UsersTable";
import { getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  return (
    <>
      <UsersTable />
      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
