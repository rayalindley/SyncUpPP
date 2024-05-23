import UsersTable from "@/components/app/UsersTable";
import { getAllUsers, getUser } from "@/lib/supabase/server";
import { User } from "@supabase/auth-js/dist/module/lib/types";
import { getUserProfileById } from "@/lib/userActions";

export default async function DashboardPage() {
  const { user } = await getUser();

  const users: User[] = (await getAllUsers()) ?? [];
  const userProfiles = await Promise.all(
    users.map((user) => getUserProfileById(user.id))
  );

  return (
    <>
      <UsersTable
        users={users}
        userProfiles={
          userProfiles
            ? userProfiles.map((up) => up.data).filter((data) => data !== null)
            : []
        }
      />
      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
