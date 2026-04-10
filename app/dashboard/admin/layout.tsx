"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import SideNavMenuForAdmin from "@/components/dashboard/side_nav_menu_for_admins";
import { Organization } from "@/types/organization";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/Loader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuthAndFetchOrganizations() {
      try {
        const { user } = await getUser();
        
        // Check if user is admin
        if (!user || (user.user_metadata?.role !== "admin" && user.user_metadata?.role !== "organizer" && user.user_metadata?.role !== "both")) {
          redirect("/dashboard");
          return;
        }

        setIsAuthorized(true);

        const supabase = createClient();

        // Get all organizations
        const { data } = await supabase
          .from("organizations")
          .select("*");
        setOrganizations(data || []);
      } catch (error) {
        console.error("Error checking auth or fetching organizations:", error);
        redirect("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetchOrganizations();
  }, []);

  if (loading) return <Loader />;

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-eerieblack">
      {/* Admin Sidebar */}
      <div className="w-72 border-r border-charleston overflow-y-auto">
        <SideNavMenuForAdmin organizations={organizations} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <main className="p-8 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}