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
          // console.log("Change received in organizationmembers!", payload);
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
          // console.log("Change received in events!", payload);
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
          // console.log("Change received in posts!", payload);
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
      className="flex flex-col overflow-hidden rounded-2xl border border-[#2e2e2e] bg-[#232323] transition duration-200 hover:scale-[1.03] hover:bg-charleston"
    >
      <div className="relative">
        {banner ? (
          <img
            className="h-24 w-full object-cover sm:h-32 lg:h-36"
            src={`${supabaseStorageBaseUrl}/${banner}`}
            alt="Banner"
          />
        ) : (
          <div className="h-24 w-full bg-light sm:h-32 lg:h-36"></div>
        )}
        {photo ? (
          <img
            className="absolute bottom-0 left-4 h-20 w-20 translate-y-1/2 transform rounded-lg border-4 border-primary object-cover sm:left-6 sm:h-24 sm:w-24 lg:left-8 lg:h-28 lg:w-28"
            src={`${supabaseStorageBaseUrl}/${photo}`}
            alt="Profile"
          />
        ) : (
          <div className="absolute bottom-0 left-4 flex h-20 w-20 translate-y-1/2 transform items-center justify-center rounded-lg border-4 border-primary bg-zinc-700 sm:left-6 sm:h-24 sm:w-24 lg:left-8 lg:h-28 lg:w-28">
            <span className="text-3xl font-medium uppercase text-light sm:text-4xl lg:text-5xl">
              {getInitials(name)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 py-6 pt-12 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16">
        <h3 className="text-base font-semibold leading-7 tracking-tight text-light sm:text-lg">
          {name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2 text-xs leading-6 text-light sm:text-sm">
          <div className="flex items-center">
            <UserGroupIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5" />
            {total_members}
          </div>
          <div className="flex items-center">
            <InboxIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5" />
            {total_posts}
          </div>
          <div className="flex items-center">
            <CalendarIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5" />
            {total_events}
          </div>
        </div>
        <p className="mt-3 text-sm font-normal text-light sm:mt-4 sm:text-base">
          {truncatedDescription}
        </p>
      </div>
    </Link>
  );
};

export default OrganizationCard;
