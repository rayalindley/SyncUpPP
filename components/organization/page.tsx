"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/Loader";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";

interface Organization {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  member_count: number;
}

export default function MyOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyOrganizations() {
      try {
        const { user } = await getUser();
        const supabase = createClient();

        // Get organizations the user is a member of
        const { data: memberships } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user?.id);

        if (memberships && memberships.length > 0) {
          const orgIds = memberships.map((m) => m.organization_id);

          // Fetch organization details
          const { data: orgsData } = await supabase
            .from("organizations")
            .select("*")
            .in("id", orgIds);

          setOrganizations(orgsData || []);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMyOrganizations();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-light">My Organizations</h1>
        <p className="text-gray-400 mt-2">Organizations you're a member of</p>
      </div>

      {organizations.length === 0 ? (
        <div className="bg-charleston border border-fadedgrey rounded-lg p-12 text-center">
          <BuildingOffice2Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-light mb-2">No Organizations Yet</h3>
          <p className="text-gray-400 mb-6">
            You haven't joined any organizations yet. Browse available organizations to get started!
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-primary hover:bg-primarydark text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Browse Organizations
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-charleston border border-fadedgrey rounded-lg p-6 hover:border-primary transition-colors"
            >
              {/* Organization Logo */}
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-40 bg-raisinblack rounded-lg mb-4 flex items-center justify-center">
                  <BuildingOffice2Icon className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Organization Info */}
              <h3 className="text-xl font-bold text-light mb-2">{org.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {org.description || "No description available"}
              </p>

              {/* Member Count */}
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                <span>👥</span>
                <span>{org.member_count} members</span>
              </div>

              {/* Action Button */}
              <a
                href={`/organization/${org.id}`}
                className="inline-block w-full bg-primary hover:bg-primarydark text-white font-medium py-2 px-4 rounded-lg transition-colors text-center text-sm"
              >
                View Organization
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}