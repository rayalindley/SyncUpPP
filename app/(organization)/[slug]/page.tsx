import Footer from "@/components/footer";
import Header from "@/components/header";
import OrganizationViewTabs from "@/components/organization/organization_view_tabs";
import SocialIcons from "@/components/organization/social_icons";
import { fetchEvents } from "@/lib/events";
import { getMemberships } from "@/lib/memberships";
import { createClient, getUser } from "@/lib/supabase/server";
import Link from "next/link";
import { check_permissions } from "@/lib/organization";
import JoinButton from "@/components/organization/join_organization_button";
import { User } from "@supabase/supabase-js";
import { CalendarIcon, InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { getVisiblePostsAndComments } from "@/lib/posts_tab"; // Import getVisiblePostsAndComments
import { checkMembership } from "@/lib/events"; // Add this import
import { Metadata, ResolvingMetadata } from 'next/types';

// Add this type for the props
type Props = {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Add this function to generate metadata
export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = params

  const supabase = createClient();
  const { data: org, error } = await supabase
    .from("organization_summary")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !org) {
    return {
      title: 'Organization Not Found',
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: org.name,
    description: org.description,
    openGraph: {
      title: `${org.name} - Organization Page`,
      description: org.description,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/organization/${slug}`,
      siteName: 'Your Site Name',
      images: [
        {
          url: org.photo ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${org.photo}` : '',
          width: 1200,
          height: 630,
          alt: `${org.name} logo`,
        },
        ...previousImages,
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${org.name} - Organization Page`,
      description: org.description,
      images: [org.photo ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${org.photo}` : ''],
    },
  }
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

export default async function OrganizationUserView({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { user } = await getUser();
  const { slug } = params;
  if (!slug) throw new Error("Slug is missing");

  const supabase = createClient();
  let { data: org, error } = await supabase
    .from("organization_summary")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !org) {
    return <div>Organization not found</div>;
  }

  let membershipStatus: "none" | "member" | "pending" | "admin" = "none";
  if (user) {
    if (user.id === org.adminid) {
      membershipStatus = "admin";
    } else {

      // Use checkMembership function to check if user is a member
      const { isMember, error } = await checkMembership(user.id, org.organizationid);

      if (error) {
        console.error("Error checking membership:", error);
      } else if (isMember) {
        membershipStatus = "member";
      } else {
        const { data: requestData } = await supabase
          .from("organization_requests")
          .select("*")
          .eq("org_id", org.organizationid)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .single();
        if (requestData) {
          membershipStatus = "pending";
        }
      }
    }
  }

  const currentPage = 1;
  const eventsPerPage = 6;

  const { data: events, error: eventsError } = await fetchEvents(org.organizationid);
  const memberships = await getMemberships(org.organizationid);

  const socials = org?.socials || {};


  const { data: postsData, error: postsError } = await getVisiblePostsAndComments(
    user?.id ?? "",
    org.organizationid
  );
  if (postsError) {
    console.error("Error fetching posts:", postsError);
  }


  return (
    <div>
      <Header user={user as User | null} />
      <main className="isolate flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="relative w-full max-w-7xl">
          {org.banner ? (
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${org.banner}`}
              alt={`${org.name} logo`}
              className="h-48 w-full rounded-lg object-cover sm:h-64 lg:h-80"
            />
          ) : (
            <div className="h-48 w-full rounded-lg bg-zinc-200 sm:h-64 lg:h-80"></div>
          )}
          <div className="absolute w-full -translate-y-1/2 transform px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-end gap-4 sm:flex-row sm:justify-between">
              <div className="h-24 w-24 rounded-xl border-4 border-primary sm:h-32 sm:w-32">
                {org.photo ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${org.photo}`}
                    alt={`${org.name} logo`}
                    className="h-full w-full rounded-lg"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-zinc-700">
                    <span className="text-5xl font-medium uppercase text-light">
                      {getInitials(org.name)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:flex-row">
                {membershipStatus !== "admin" && (
                  <JoinButton
                    organizationId={org.organizationid}
                    organizationName={org.name}
                    organizationAccess={org.organization_access}
                    initialMembershipStatus={membershipStatus}
                  />
                )}
                {(await check_permissions(
                  user?.id || "",
                  org.organizationid,
                  "view_dashboard"
                )) && (
                  <Link
                    className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primarydark"
                    href={`${slug}/dashboard`}
                  >
                    Manage
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="mt-12 space-y-4 px-4 sm:mt-16 sm:px-6 lg:mt-24 lg:px-8">
            <h1 className="text-2xl font-bold text-light sm:text-3xl lg:text-4xl">
              {org.name}
            </h1>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="mb-2 flex items-center sm:mb-0 sm:mr-4">
                <UserGroupIcon className="mr-1 h-5 w-5 text-primary" />
                <p className="text-sm text-light">{org.total_members} members</p>
              </div>
              <div className="mb-2 flex items-center sm:mb-0 sm:mr-4">
                <InboxIcon className="mr-1 h-5 w-5 text-primary" />
                <p className="text-sm text-light">{org.total_posts} posts</p>
              </div>
              <div className="mb-2 flex items-center sm:mb-0 sm:mr-4">
                <CalendarIcon className="mr-1 h-5 w-5 text-primary" />
                <p className="text-sm text-light">{org.total_events} events</p>
              </div>
            </div>
            <div className="text-sm text-light sm:text-base">{org.description}</div>
            <SocialIcons
              facebook={socials.facebook}
              twitter={socials.twitter}
              linkedin={socials.linkedin}
            />
            <OrganizationViewTabs
              organizationid={org.organizationid}
              memberships={memberships}
              events={events}
              id={user?.id ?? ""}
              posts={postsData} // Pass postsData as posts prop
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
