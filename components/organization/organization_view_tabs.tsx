"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrganizationEventsComponent from "./organization_events";
import OrganizationMembershipsComponent from "../memberships/organization_membership";
import OrganizationPostsComponent from "./organization_posts";

const TabsComponent = ({ organizationid, memberships, events, id }: { organizationid: string; memberships: any; events: any; id: string }) => {
  const { orgslug } = useParams() as { orgslug: string };
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const query = new URLSearchParams(window.location.search);
      const initialTab = query.get("tab") || "posts";
      setActiveTab(initialTab);

      const handlePopState = () => {
        const urlTab = query.get("tab");
        if (urlTab && urlTab !== activeTab) {
          setActiveTab(urlTab);
        }
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const query = new URLSearchParams(window.location.search);
      query.set("tab", tab);
      const newUrl = `${window.location.pathname}?${query.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  let tabContent = null;
  if (activeTab === "posts") {
    tabContent = <OrganizationPostsComponent organizationid={organizationid} />;
  } else if (activeTab === "membership") {
    tabContent = <OrganizationMembershipsComponent memberships={memberships} userid={id} />;
  } else if (activeTab === "events") {
    tabContent = <OrganizationEventsComponent events={events} userid={id} organizationId={organizationid} />;
  }

  return (
    <div>
      <div>
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8 px-4 sm:px-6" aria-label="Tabs">
            <button
              onClick={() => handleTabChange("posts")}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-base font-medium ${
                activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-light hover:border-gray-300 hover:text-gray-300"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => handleTabChange("membership")}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-base font-medium ${
                activeTab === "membership" ? "border-primary text-primary" : "border-transparent text-light hover:border-gray-300 hover:text-gray-300"
              }`}
            >
              Membership
            </button>
            <button
              onClick={() => handleTabChange("events")}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-base font-medium ${
                activeTab === "events" ? "border-primary text-primary" : "border-transparent text-light hover:border-gray-300 hover:text-gray-300"
              }`}
            >
              Events
            </button>
          </nav>
        </div>
        <div className="mt-8">{tabContent}</div>
      </div>
    </div>
  );
};

export default TabsComponent;
