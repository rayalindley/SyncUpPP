import MembersTableAll from "@/components/memberships/members_table_all";
import { fetchAllOrganizations, fetchOrganizationsForUser } from "@/lib/organization";
import { createClient,getUser } from "@/lib/supabase/server";
import { Organization } from "@/types/organization";
import { redirect } from "next/navigation";


interface OrganizationMember {
  organizationmemberid: string;
  organizationid: string;
  userid: string;
  membershipid: string | null;
  roleid: string;
  joindate: string;
  enddate: string | null;
  months: number;
  expiration_date: string | null;
  organization_slug: string;
  organization: any;
  user: {
    gender: string;
    userid: string;
    company: string;
    website: string;
    last_name: string;
    updatedat: string;
    first_name: string;
    dateofbirth: string | null;
    description: string;
    profilepicture: string;
  };
  membership: {
    name: string | null;
    features: any | null;
    description: string | null;
    membershipid: string | null;
    cycletype: string;
    registrationfee: number | null;
  };
  role: {
    role: string;
    color: string;
    roleid: string;
    editable: boolean;
    deletable: boolean;
  };
  payments?: {
    type: string;
    amount: number;
    status: string;
    invoiceId: string;
    paymentId: string;
    created_at: string;
    invoiceUrl: string;
  }[];
}

export default async function MembersPage() {
const {user} = await getUser();
const supabase = createClient();

if(!user) {
  return redirect("/signin");
}

let organizations: Organization[]= [];
let members: OrganizationMember[]= [];

if (user.role === "superadmin") {
  const organizationsData = await fetchAllOrganizations();
  organizations = organizationsData || [];
  const { data: membersData } = await supabase.from("organizationmembers").select("*");
  members = membersData || [];
}
else {
  const organizationsData = await fetchOrganizationsForUser(user.id);
  organizations = organizationsData.data || [];
  const { data: membersData } = await supabase.from("organization_members_with_admin_view").select("*").eq("organization_adminid", user.id);
  members = membersData || [];
}

  return <MembersTableAll members={members} organizations={organizations} />;
}
