"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import UserEvents from "@/components/user/user_events";
import UserOrganizations from "@/components/user/user_organizations";
import { fetchEventsForUser } from "@/lib/events";
import { fetchOrganizationsForUser } from "@/lib/organization";
import { getUser } from "@/lib/supabase/client";
import { Event, Organization, UserProfile } from "@/lib/types";
import { updateUserProfileById } from "@/lib/userActions";
import { PencilIcon } from "@heroicons/react/24/solid";
import { User } from "@supabase/auth-js";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("events");
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { user } = await getUser();
      setUser(user);

      if (user) {
        const { data, error } = await updateUserProfileById(user.id, {});
        if (data) {
          setUserProfile(data);
        } else {
          console.error("Error fetching user profile:", error);
        }

        // Fetch user events
        const { data: eventsData, error: eventsError } = await fetchEventsForUser(
          user.id
        );
        if (eventsData) {
          setUserEvents(eventsData);
        } else {
          console.error("Error fetching user events:", eventsError);
        }

        // Fetch user organizations
        const { data: organizationsData, error: organizationsError } =
          await fetchOrganizationsForUser(user.id);
        if (organizationsData) {
          setUserOrganizations(organizationsData);
        } else {
          console.error("Error fetching user organizations:", organizationsError);
        }
      }
    }

    fetchData();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const tabContent = () => {
    switch (activeTab) {
      case "events":
        return <UserEvents events={userEvents} />;
      case "organizations":
        return <UserOrganizations organizations={userOrganizations} />;
      default:
        return null;
    }
  };

  // Define the base URL for your Supabase storage bucket
  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public";

  return (
    <>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 lg:px-8">
        <Header user={user} />
        <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-eerieblack px-6 py-12 lg:px-8">
          {userProfile && (
            <div className="text-center">
              <img
                src={`${supabaseStorageBaseUrl}/${userProfile.profilepicture}`}
                alt="Profile"
                className="mx-auto h-32 w-32 rounded-full object-cover"
              />
              <div className="mt-4 flex items-center justify-center space-x-2">
                <h1 className="text-2xl font-bold text-white">
                  {userProfile.first_name} {userProfile.last_name}
                </h1>
                <Link href={`/user/edit/${user?.id}`}>
                  <PencilIcon className="h-4 w-4 text-gray-400 hover:text-primary" />
                </Link>
              </div>
              <div className="mt-8 border-b border-gray-700">
                <nav
                  className="-mb-px flex justify-center space-x-8 px-4 sm:px-6"
                  aria-label="Tabs"
                  style={{ minWidth: "500px" }} // Set a minimum width here
                >
                  <button
                    onClick={() => handleTabChange("events")}
                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-base font-medium ${
                      activeTab === "events"
                        ? "border-primary text-primary"
                        : "border-transparent text-light hover:border-gray-300 hover:text-gray-300"
                    }`}
                  >
                    Events
                  </button>
                  <button
                    onClick={() => handleTabChange("organizations")}
                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-base font-medium ${
                      activeTab === "organizations"
                        ? "border-primary text-primary"
                        : "border-transparent text-light hover:border-gray-300 hover:text-gray-300"
                    }`}
                  >
                    Organizations
                  </button>
                </nav>
              </div>
              <div className="mt-8 min-h-[400px] min-w-[500px]">{tabContent()}</div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
