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
      className="flex flex-col overflow-hidden rounded-lg border border-[#2e2e2e] bg-[#232323] transition duration-200 hover:scale-[1.02] hover:bg-charleston"
    >
      <div className="relative">
        {banner ? (
          <img
            className="h-20 w-full object-cover sm:h-24 md:h-28 lg:h-32"
            src={`${supabaseStorageBaseUrl}/${banner}`}
            alt="Banner"
          />
        ) : (
          <div className="h-20 w-full bg-light sm:h-24 md:h-28 lg:h-32"></div>
        )}
        {photo ? (
          <img
            className="absolute bottom-0 left-3 h-16 w-16 translate-y-1/2 transform rounded-lg border-2 border-primary object-cover sm:left-4 sm:h-20 sm:w-20 md:left-5 md:h-24 md:w-24 lg:left-6 lg:h-28 lg:w-28"
            src={`${supabaseStorageBaseUrl}/${photo}`}
            alt="Profile"
          />
        ) : (
          <div className="absolute bottom-0 left-3 flex h-16 w-16 translate-y-1/2 transform items-center justify-center rounded-lg border-2 border-primary bg-zinc-700 sm:left-4 sm:h-20 sm:w-20 md:left-5 md:h-24 md:w-24 lg:left-6 lg:h-28 lg:w-28">
            <span className="text-2xl font-medium uppercase text-light sm:text-3xl md:text-4xl lg:text-5xl">
              {getInitials(name)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 py-4 pt-10 sm:px-4 sm:pt-12 md:px-5 md:pt-14 lg:px-6 lg:pt-16">
        <h3 className="text-sm font-semibold leading-6 tracking-tight text-light sm:text-base md:text-lg">
          {name}
        </h3>
        <div className="mt-1 flex flex-wrap gap-2 text-xs leading-5 text-light sm:mt-2 sm:text-sm">
          <div className="flex items-center">
            <UserGroupIcon className="mr-1 h-3 w-3 text-primary sm:h-4 sm:w-4" />
            {total_members}
          </div>
          <div className="flex items-center">
            <InboxIcon className="mr-1 h-3 w-3 text-primary sm:h-4 sm:w-4" />
            {total_posts}
          </div>
          <div className="flex items-center">
            <CalendarIcon className="mr-1 h-3 w-3 text-primary sm:h-4 sm:w-4" />
            {total_events}
          </div>
        </div>
        <p className="mt-2 text-xs font-normal text-light sm:mt-3 sm:text-sm">
          {truncatedDescription}
        </p>
      </div>
    </Link>
  );
};

export default OrganizationCard;
