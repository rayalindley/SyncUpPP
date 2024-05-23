import OrganizationsTable from "@/components/app/OrganizationsTable";
import UsersTable from "@/components/app/UsersTable";
import { createClient, getUser } from "@/lib/supabase/server";
import MembershipsTable from "@/components/memberships/MembershipsTable";
import MembershipTiers from "@/components/memberships/membership_tiers";

export default async function MembershipsPage() {
  const { user } = await getUser();

  const supabase = createClient();

  const { data: orgmems, error: orgmemsError } =
    (await supabase.from("organization_memberships").select("*")) ?? [];

  const { data: allMembers, error: allMembersError  } =
    (await supabase.from("user_membership_info").select("*")) ?? [];

  return (
    <>
      <MembershipsTable orgmems={orgmems} allMembers={allMembers} />
    </>
  );
}
