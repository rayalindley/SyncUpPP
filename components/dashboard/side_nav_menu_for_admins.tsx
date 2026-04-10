"use client";

import { Organization } from "@/types/organization";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IoIosAnalytics, IoIosClipboard } from "react-icons/io";
import { IoCalendarOutline } from "react-icons/io5";
import { BuildingOffice2Icon, XMarkIcon } from "@heroicons/react/24/outline";
import useSidebarStore from "@/store/useSidebarStore";

interface SideNavMenuForAdminProps {
  organizations: Organization[];
}

export default function SideNavMenuForAdmin({
  organizations,
}: SideNavMenuForAdminProps) {
  const pathname = usePathname();
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const { sidebarOpen, setSidebarOpen } = useSidebarStore();

  const isActive = (href: string) => pathname === href;

  const navigation = [
    {
      name: "Overview",
      href: "/dashboard/admin",
      icon: IoIosAnalytics,
    },
    {
      name: "My Events",
      href: "/dashboard/events",
      icon: IoCalendarOutline,
    },
    {
      name: "My Organizations",
      href: "/dashboard/organizations",
      icon: BuildingOffice2Icon,
    },
    {
      name: "FAQs",
      href: "/dashboard/faqs",
      icon: IoIosClipboard,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-eerieblack">
      {/* Logo Section */}
      <Link href="/">
        <div className="flex h-20 shrink-0 items-center border-b border-charleston px-6 cursor-pointer hover:bg-charleston/50 transition-colors">
          <img className="h-8 w-auto" src="/syncup.png" alt="SyncUp" />
          <p className="ml-2 font-semibold text-light">SyncUp++</p>
        </div>
      </Link>

      {/* Organization Selector */}
      <div className="p-6 border-b border-charleston space-y-3">
        <label className="text-xs font-semibold text-gray-400 uppercase">
          Organization
        </label>
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="w-full rounded-md bg-charleston text-sm text-light shadow-sm ring-1 ring-inset ring-fadedgrey focus:border-primary focus:outline-none focus:ring-primary p-2.5 cursor-pointer hover:bg-raisinblack transition-colors"
        >
          <option value="">All Organizations</option>
          {organizations.map((org) => (
            <option key={org.organizationid} value={org.organizationid}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

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
                  : "text-gray-400 hover:text-light hover:bg-charleston"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Back to Attendee Dashboard */}
      <div className="border-t border-charleston p-6 space-y-3">
        <Link href="/dashboard">
          <button className="w-full bg-primary hover:bg-primarydark text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            ← Attendee Dashboard
          </button>
        </Link>
        <p className="text-xs text-gray-500 text-center">
          You're viewing as Admin
        </p>
      </div>
    </div>
  );
}