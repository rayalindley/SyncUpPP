"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrganizationEventsComponent from "./organization_events";
import OrganizationMembershipsComponent from "../memberships/organization_membership";
import PostsSection from "./posts_section";

const OrganizationViewTabs = ({
  organizationid,
  memberships,
  events,
  id,
  posts, // Add posts prop
}: {
  organizationid: string;
  memberships: any;
  events: any;
  id: string;
  posts: any; // Ensure posts is typed
}): JSX.Element => {
  const { orgslug } = useParams() as { orgslug: string };
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const query = new URLSearchParams(window.location.search);
      setActiveTab(query.get("tab") || "posts");
      const handlePopState = () => {
        const urlTab = new URLSearchParams(window.location.search).get("tab");
        if (urlTab && urlTab !== activeTab) setActiveTab(urlTab);
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const query = new URLSearchParams(window.location.search);
      query.set("tab", tab);
      window.history.pushState({}, "", `${window.location.pathname}?${query.toString()}`);
    }
  };

  const availableTabs = ["posts", "events"];
  if (memberships && memberships.length > 0) {
    availableTabs.push("membership");
  }

  const tabContent = {
    posts: <PostsSection organizationId={organizationid} initialPosts={posts} />, // Pass posts to PostsSection
    membership: (
      <OrganizationMembershipsComponent
        memberships={memberships}
        userid={id}
        organizationid={organizationid}
      />
    ),
    events: (
      <OrganizationEventsComponent
        events={events}
        userid={id}
        organizationId={organizationid}
      />
    ),
  }[activeTab];

  return (
    <div>
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8 px-4 sm:px-6" aria-label="Tabs">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-base font-medium ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-light hover:border-gray-300 hover:text-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-8">{tabContent}</div>
    </div>
  );
};

export default OrganizationViewTabs;
