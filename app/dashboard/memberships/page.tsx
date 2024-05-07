import OrganizationsTable from "@/components/app/OrganizationsTable";
import UsersTable from "@/components/app/UsersTable";
import { createClient, getUser } from "@/lib/supabase/server";
import MembershipsTable from "@/components/app/MembershipsTable";

export default async function MembershipsPage() {
  const { user } = await getUser();

  const supabase = createClient();

  const { data: orgmems, error } =
    (await supabase.from("organization_memberships").select("*")) ?? [];

  return (
    <>
      <MembershipsTable orgmems = {orgmems}/>

      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
