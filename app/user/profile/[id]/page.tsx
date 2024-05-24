"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import UserEvents from "@/components/user/user_events";
import UserOrganizations from "@/components/user/user_organizations";
import { fetchEventsForUser } from "@/lib/events";
import { createClient, getUser } from "@/lib/supabase/client";
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

      const supabase = createClient();

      if (user) {
        const { data, error } = await updateUserProfileById(id, {});
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

        // Fetch user organizations using summary
        const { data: organizationsData, error: organizationsError } = await supabase
          .from("organization_summary")
          .select("*")
          .eq("adminid", user.id);
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
  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <main className="flex w-full flex-1 flex-col items-center justify-center bg-eerieblack px-6 py-12 lg:px-8">
          {userProfile && (
            <div className="w-full max-w-7xl text-center">
              {userProfile.profilepicture ? (
                <img
                  src={`${supabaseStorageBaseUrl}/${userProfile.profilepicture}`}
                  alt="Profile"
                  className="mx-auto h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gray-500 text-5xl font-bold text-white">
                  {getInitials(userProfile.first_name ?? "", userProfile.last_name ?? "")}
                </div>
              )}
              <div className="mb-4 mt-4 flex items-center justify-center space-x-2">
                <h1 className="text-2xl font-bold text-white">
                  {userProfile.first_name} {userProfile.last_name}
                </h1>

                {user?.id === id && (
                  <Link href={`/user/edit/${user?.id}`}>
                    <PencilIcon className="h-4 w-4 text-gray-400 hover:text-primary" />
                  </Link>
                )}
              </div>
              <div className="text-sm text-light">{userProfile.description}</div>
              <div className="mt-8 border-b border-gray-700">
                <nav className="-mb-px flex justify-center space-x-8" aria-label="Tabs">
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
              <div className="mt-8 w-full">{tabContent()}</div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
