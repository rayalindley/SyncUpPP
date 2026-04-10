"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IoIosAnalytics, IoIosClipboard } from "react-icons/io";
import { IoCalendarOutline } from "react-icons/io5";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";
import useSidebarStore from "@/store/useSidebarStore";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getUser } from "@/lib/supabase/client";

export default function SideNavMenuForUsers() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    async function fetchUserRole() {
      const { user } = await getUser();
      setUserRole(user?.user_metadata?.role || "");
    }
    fetchUserRole();
  }, []);

  const isActive = (href: string) => pathname === href;
  const isOrganizerOrBoth = userRole === "organizer" || userRole === "both";

  const navigation = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: IoIosAnalytics,
    },
    {
      name: "My Events",
      href: "/dashboard/events",
      icon: IoCalendarOutline,
    },
    {
      name: "My Organizations",
      href: "/organization",
      icon: BuildingOffice2Icon,
    },
    {
      name: "FAQs",
      href: "/dashboard/faqs",
      icon: IoIosClipboard,
    },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 bg-charleston h-full flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-raisinblack rounded transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-light" />
            </button>

            {/* Logo */}
            <Link href="/">
              <div className="flex h-20 shrink-0 items-center border-b border-fadedgrey px-6 cursor-pointer hover:bg-raisinblack transition-colors">
                <img className="h-8 w-auto" src="/syncup.png" alt="SyncUp" />
                <p className="ml-2 font-semibold text-light">SyncUp++</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary text-white shadow-lg"
                        : "text-gray-400 hover:text-light hover:bg-raisinblack"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Organizer Button - Only show if user is organizer or both */}
            {isOrganizerOrBoth && (
              <div className="border-t border-fadedgrey p-6 space-y-3">
                <Link href="/dashboard/admin">
                  <button className="w-full bg-primary hover:bg-primarydark text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                    → Organizer Dashboard
                  </button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  Switch to organizer view
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full w-72 flex-col bg-charleston border-r border-fadedgrey overflow-hidden">
        {/* Logo */}
        <Link href="/">
          <div className="flex h-20 shrink-0 items-center border-b border-fadedgrey px-6 cursor-pointer hover:bg-raisinblack transition-colors">
            <img className="h-8 w-auto" src="/syncup.png" alt="SyncUp" />
            <p className="ml-2 font-semibold text-light">SyncUp++</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-white shadow-lg"
                    : "text-gray-400 hover:text-light hover:bg-raisinblack"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Organizer Button - Only show if user is organizer or both */}
        {isOrganizerOrBoth && (
          <div className="border-t border-fadedgrey p-6 space-y-3">
            <Link href="/dashboard/admin">
              <button className="w-full bg-primary hover:bg-primarydark text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                → Organizer Dashboard
              </button>
            </Link>
            <p className="text-xs text-gray-500 text-center">
              Switch to organizer view
            </p>
          </div>
        )}
      </div>
    </>
  );
}