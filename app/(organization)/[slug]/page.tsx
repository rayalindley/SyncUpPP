"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";

import TabsComponent from "@/components/organization/organization_view_tabs";
import SocialIcons from "@/components/organization/social_icons";
import { fetchEvents } from "@/lib/events";
import { createClient, getUser } from "@/lib/supabase/server";
import { InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { ToastContainer } from "react-toastify";

import Footer from "@/components/Footer";
import { UserGroupIcon } from "@heroicons/react/24/outline";

export default function NewsletterPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);
export default function NewsletterPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    if (!user) return;
  const fetchOrganizations = async () => {
    if (!user) return;

    const supabase = createClient();
    try {
      let { data: orgs, error } = await supabase
        .from('organizations')
        .select('organizationid, name, slug')
        .eq('adminid', user.id);

      if (error) {
        console.error("Error fetching organizations:", error);
        return;
      }

      setOrganizations(orgs || []);
    } catch (e) {
      console.error("Unexpected error fetching organizations:", e);
    }
  };

  const handleOrganizationClick = (slug: string) => {
    window.location.href = `/newsletter/${slug}`;
  };
    const supabase = createClient();
    try {
      let { data: orgs, error } = await supabase
        .from('organizations')
        .select('organizationid, name, slug')
        .eq('adminid', user.id);


  // Fetch events data
  const currentPage = 1; // Set the current page
  const eventsPerPage = 6; // Set the number of events per page
  const { data: events, error: eventsError } = await fetchEvents(
    org.organizationid,
    currentPage,
    eventsPerPage
  );

  // Handle any errors from fetching events
  if (eventsError) {
    console.error("Error fetching events:", eventsError);
    return; // Optionally, handle the error in your UI
  }
  // Assuming `org` is an object retrieved from your database that contains the social media links object
  const socials = org.socials || {}; // Use default empty object if `org.socials` is undefined or null

      if (error) {
        console.error("Error fetching organizations:", error);
        return;
      }


      setOrganizations(orgs || []);
    } catch (e) {
      console.error("Unexpected error fetching organizations:", e);
    }
  };

  const handleOrganizationClick = (slug: string) => {
    window.location.href = `/newsletter/${slug}`;
  };

  return (
    <div>
      <Header user={user} />
      <main className="isolate flex justify-center sm:px-4 md:px-6 lg:px-80">
        <div className="relative">
          <div className="relative rounded-xl bg-dark p-8 shadow-lg sm:p-16 lg:p-40">
            <h1 className="text-center text-3xl font-bold text-light">Newsletter Creation</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {organizations.map((org) => (
                <div
                  key={org.organizationid}
                  className="cursor-pointer p-4 border rounded shadow-md text-light hover:bg-gray-700"
                  onClick={() => handleOrganizationClick(org.slug)}
                >
                  <h2 className="text-xl font-semibold">{org.name}</h2>
                  <div className="mt-2 flex items-center justify-center">
                    <UserGroupIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    <p className="text-sm">Members: {org.members}</p>
                  </div>
                </div>
              ))}
          <div className="relative rounded-xl bg-dark p-8 shadow-lg sm:p-16 lg:p-40">
            <h1 className="text-center text-3xl font-bold text-light">Newsletter Creation</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {organizations.map((org) => (
                <div
                  key={org.organizationid}
                  className="cursor-pointer p-4 border rounded shadow-md text-light hover:bg-gray-700"
                  onClick={() => handleOrganizationClick(org.slug)}
                >
                  <h2 className="text-xl font-semibold">{org.name}</h2>
                  <div className="mt-2 flex items-center justify-center">
                    <UserGroupIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    <p className="text-sm">Members: {org.members}</p>
                  </div>
                </div>
              ))}
            </div>
            <TabsComponent organizationid={org.organizationid} events={events} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
