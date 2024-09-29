"use client";
import { createClient, getUser } from "@/lib/supabase/client";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { fetchOrganizationMembersBySlug } from "@/lib/memberships";
import MembersTable from "@/components/memberships/members_table";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Preloader from "@/components/preloader";
import { Organization } from "@/types/organization";
import { User } from "@supabase/auth-js";

// Define the expected type for a member
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
    yearlydiscount: number | null;
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

export default function OrganizationMembersPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]); // Define the type of members state
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchData() {
      const userData = await getUser();
      setUser(userData.user);

      try {
        const { data, error } = await fetchOrganizationBySlug(slug);
        if (error) {
          console.error("Error fetching organization:", error);
          setLoading(false);
          return;
        } else {
          setOrganization(data);
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        setLoading(false);
        return;
      }
    }

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (!user || !organization) return; // Exit early if user or organization is not set

    async function checkUserPermissions() {
      try {
        if (user && organization) {
          const permission = await check_permissions(
            user.id,
            organization.organizationid,
            "view_dashboard" // Permission key for viewing members
          );
          setHasPermission(permission);
        } else {
          console.error("User or organization is not set");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
      } finally {
        setLoading(false); // Set loading to false after permission check
      }
    }

    checkUserPermissions();
  }, [user, organization]);

  useEffect(() => {
    if (!organization || !hasPermission) return; // Exit early if organization is not set or no permission

    async function fetchMembers() {
      try {
        const membersData = await fetchOrganizationMembersBySlug(slug);
        setMembers(membersData ? membersData : []); // Assign the fetched members data
      } catch (error) {
        console.error("Error fetching members:", error);
        setLoading(false);
        setMembers([]); // Ensure members state is reset to an empty array on error
      }
    }

    fetchMembers();
  }, [organization, hasPermission]);

  if (loading) {
    return <Preloader />;
  }

  if (!user || !hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Organization Members</h1>
          <p className="text-lg">
            {user ? "You do not have permission to view members for this organization." : "Please log in to view members."}
          </p>
          {!user && (
            <button
              onClick={() => router.push("/signin")}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {organization && (
        <MembersTable
          members={members ?? []}
          organization={organization}
        />
      )}
    </div>
  );
}
