import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TabsComponent from "@/components/organization/organization_view_tabs";
import SocialIcons from "@/components/organization/social_icons";
import { fetchEvents } from "@/lib/events";
import { getMemberships } from "@/lib/memberships";
import { fetchPosts } from "@/lib/posts";
import { createClient, getUser } from "@/lib/supabase/server";
import { CalendarIcon, InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { ToastContainer } from "react-toastify";

import { check_permissions, getUserOrganizationInfo } from "@/lib/organization";

const getInitials = (name: string): string => {
  const words = name.split(" ");
  if (words.length > 1) {
    return words[0][0] + words[1][0];
  } else {
    return name.substring(0, 2);
  }
};

export default async function OrganizationUserView({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { user } = await getUser();

  const { slug } = params;

  // console.log("slug:", slug);

  // ! GET Request on Get Organization by Slug, then display the data, pass it to the nested components

  const supabase = createClient();

  let { data: org, error } = await supabase
    .from("organization_summary")
    .select("*")
    .eq("slug", slug)
    .single();

  // console.log(org);

  // console.log(user?.id, org.organizationid);

  let userOrgInfo = await getUserOrganizationInfo(user?.id!, org.organizationid);

  // console.log(userOrgInfo);

  // Inside your component
  const currentPage = 1; // Set the current page
  const postsPerPage = 6; // Set the number of posts per page

  // Fetch organization posts
  const { data: posts, error: postsError } = await fetchPosts(org.organizationid);

  // Handle any errors from fetching posts
  if (postsError) {
    console.error("Error fetching posts:", postsError);
    return; // Optionally, handle the error in your UI
  }

  // Fetch events data
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

  const memberships = await getMemberships(org.organizationid);

  // Assuming `org` is an object retrieved from your database that contains the social media links object
  const socials = org?.socials || {}; // Use default empty object if `org.socials` is undefined or null

  const facebookLink = socials.facebook; // Access the Facebook link
  const twitterLink = socials.twitter; // Access the Twitter link
  const linkedinLink = socials.linkedin; // Access the LinkedIn link

  // Now you can use these links in your code as needed
  // console.log("Facebook Link:", facebookLink);
  // console.log("Twitter Link:", twitterLink);
  // console.log("LinkedIn Link:", linkedinLink);
  // console.log("Org ID:", org.organizationid)
  // console.log("Memberships: ", memberships)
  // console.log(user?.id)

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  return (
    <div>
      <Header user={user} />
      <ToastContainer />
      <main className="isolate flex flex-col items-center sm:px-4 md:px-6 lg:px-80">
        <div className="relative w-full max-w-7xl">
          {org.banner ? (
            <img
              src={`${supabaseStorageBaseUrl}/${org?.banner}`}
              alt={`${org?.name} logo`}
              className="h-64 w-full rounded-lg sm:h-80"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="h-64 w-full rounded-lg bg-zinc-200 sm:h-80 "></div>
          )}

          <div className="absolute w-full -translate-y-1/2 transform px-5">
            <div className="flex flex-col items-end sm:flex-row sm:justify-between">
              <div className="h-24 w-24 rounded-xl border-4 border-primary sm:h-32 sm:w-32">
                {org.photo ? (
                  <img
                    src={`${supabaseStorageBaseUrl}/${org?.photo}`}
                    alt={`${org?.name} logo`}
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
              <div className="mt-4 sm:mt-0">
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
          <div className="mt-8 space-y-4 px-5 sm:mt-16 lg:mt-24">
            <h1 className="text-2xl font-bold text-light sm:text-3xl">{org?.name}</h1>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center">
              <div className="mb-2 flex items-center sm:mb-0 sm:mr-4">
                <UserGroupIcon className="mr-1 h-5 w-5 text-primary" />
                <p className="text-sm text-light">{org?.total_members} members</p>
              </div>
              <div className="mb-2 flex items-center sm:mb-0 sm:mr-4">
                <InboxIcon className="mr-1 h-5 w-5 text-primary" />
                <p className="text-sm text-light">{org?.total_posts} posts</p>
              </div>
              <div className="mb-2 flex items-center sm:mb-0 sm:mr-4">
                <CalendarIcon className="mr-1 h-5 w-5 text-primary" />
                <p className="text-sm text-light">{org?.total_events} events</p>
              </div>
            </div>
            <div className="text-sm text-light">{org.description}</div>
            <SocialIcons
              facebook={facebookLink}
              twitter={twitterLink}
              linkedin={linkedinLink}
            />

            <TabsComponent
              organizationid={org.organizationid}
              memberships={memberships}
              events={events}
              posts={posts}
              id={user?.id}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
