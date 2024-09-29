"use client";
import MembershipTiersClient from "@/components/app/membership_tier_client";
import { fetchMembersBySlug, fetchOrgMemBySlug } from "@/lib/memberships";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Preloader from "@/components/preloader";
import { Organizations } from "@/types/organizations";
import { User } from "@supabase/auth-js";

export default function MembershipsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organizations | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
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
            "view_dashboard" // Permission key for viewing the dashboard
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

    async function fetchData() {
      try {
        const [fetchedMemberships, fetchedMembers] = await Promise.all([
          fetchOrgMemBySlug(slug),
          fetchMembersBySlug(slug)
        ]);
        
        setMemberships(fetchedMemberships ? fetchedMemberships : []);
        setMembers(fetchedMembers ? fetchedMembers : []);
      } catch (error) {
        console.error("Error fetching memberships or members:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, [organization, hasPermission]);

  if (loading) {
    return <Preloader />;
  }

  if (!user || !hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Memberships</h1>
          <p className="text-lg">
            {user ? "You do not have permission to view memberships for this organization." : "Please log in to view memberships."}
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
    <div className="mt-8 min-w-[1265px]">
      {organization && (
        <MembershipTiersClient
          memberships={memberships}
          members={members}
          organization={organization}
        />
      )}
    </div>
  );
}
