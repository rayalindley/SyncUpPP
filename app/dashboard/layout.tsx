"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/supabase/client";
import SideNavMenuForUsers from "@/components/dashboard/side_nav_menu_for_users";
import Loader from "@/components/Loader";
import useSidebarStore from "@/store/useSidebarStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();

  useEffect(() => {
    let alive = true;

    async function checkAuth() {
      try {
        const { user } = await getUser();

        const role = user?.user_metadata?.role;
        const ok = !!user && (role === "attendee" || role === "organizer" || role === "both");

        if (!ok) {
          if (alive) setLoading(false); // Set loading to false BEFORE redirect
          router.replace("/signin");
          return;
        }

        if (alive) {
          setIsAuthorized(true);
          setLoading(false); // Set both states
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        if (alive) setLoading(false); // Set loading to false BEFORE redirect
        router.replace("/signin");
      }
    }

    checkAuth();
    return () => {
      alive = false;
    };
  }, [router]);

  if (loading) return <Loader />;
  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-eerieblack">
      <SideNavMenuForUsers />
      <div className="flex-1 overflow-y-auto">
        {/* ... */}
        <main className="p-8 lg:p-12">{children}</main>
      </div>
    </div>
  );
}