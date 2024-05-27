"use client";
import { CalendarIcon, InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrganizationCardProps {
  name: string;
  description: string;
  organization_size: string | number;
  photo: string;
  slug: string;
  banner: string;
  total_members: number;
  total_posts: number;
  total_events: number;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({
  name,
  description,
  organization_size,
  photo,
  slug,
  banner,
  total_members,
  total_posts,
  total_events,
}) => {
  // Define the base URL for your Supabase storage bucket
  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  // Use the router for navigation
  const router = useRouter();

  // Truncate description to 120 characters
  const truncatedDescription =
    description.length > 120 ? description.substring(0, 150) + "..." : description;

  const handleCardClick = () => {
    router.push(`/${slug}`);
  };

  const getInitials = (name: string) => {
    const words = name.split(" ");
    if (words.length > 1) {
      return words[0][0] + words[1][0];
    } else {
      return name.substring(0, 2);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const handleReload = () => {
      // Save the scroll position before reload
      localStorage.setItem("scrollPosition", window.scrollY.toString());
      window.location.reload();
    };

    const organizationChannel = supabase
      .channel("organizationmembers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizationmembers" },
        (payload) => {
          console.log("Change received in organizationmembers!", payload);
          handleReload();
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel("events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          console.log("Change received in events!", payload);
          handleReload();
        }
      )
      .subscribe();

    const postsChannel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          console.log("Change received in posts!", payload);
          handleReload();
        }
      )
      .subscribe();

    // Restore the scroll position after reload
    const savedScrollPosition = localStorage.getItem("scrollPosition");
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      localStorage.removeItem("scrollPosition");
    }

    // Cleanup subscriptions on unmount
    return () => {
      organizationChannel.unsubscribe();
      eventsChannel.unsubscribe();
      postsChannel.unsubscribe();
    };
  }, [router]);

  return (
    <Link
      href={`/${slug}`}
      className="mx-auto max-w-2xl transform rounded-2xl border border-[#2e2e2e] bg-[#232323] transition duration-200 hover:scale-[1.03] hover:bg-charleston lg:mx-0 lg:max-w-none"
    >
      <div className="relative">
        {banner ? (
          <img
            className="h-32 w-full rounded-t-2xl object-cover lg:h-36"
            src={`${supabaseStorageBaseUrl}/${banner}`}
            alt="Banner"
          />
        ) : (
          <div className="h-32 w-full rounded-t-2xl bg-light lg:h-36"></div>
        )}
        {photo ? (
          <img
            className="absolute bottom-0 left-8 h-28 w-28 translate-y-1/2 transform rounded-lg border-4 border-primary object-cover"
            src={`${supabaseStorageBaseUrl}/${photo}`}
            alt="Profile"
          />
        ) : (
          <div className="absolute bottom-0 left-8 flex h-28 w-28 translate-y-1/2 transform items-center justify-center rounded-lg border-4 border-primary bg-zinc-700">
            <span className="text-5xl font-medium uppercase text-light">
              {getInitials(name)}
            </span>
          </div>
        )}
      </div>
      <div className="mt-2 px-8 py-10 pt-16">
        <h3 className="text-lg font-semibold leading-7 tracking-tight text-light">
          {name}
        </h3>
        <div className="justify-left mt-2 flex space-x-4 text-sm leading-6 text-light">
          <div className="flex items-center">
            <UserGroupIcon className="-mt-1 mr-2 h-5 w-5 text-primary" />
            {total_members} members
          </div>
          <div className="flex items-center">
            <InboxIcon className="-mt-1 mr-2 h-5 w-5 text-primary" />
            {total_posts} posts
          </div>
          <div className="flex items-center">
            <CalendarIcon className="-mt-1 mr-2 h-5 w-5 text-primary" />
            {total_events} events
          </div>
        </div>
        <p className="mt-4 text-base font-normal text-light">{truncatedDescription}</p>
      </div>
    </Link>
  );
};

export default OrganizationCard;
