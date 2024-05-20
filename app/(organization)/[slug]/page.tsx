import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TabsComponent from "@/components/organization/organization_view_tabs";
import SocialIcons from "@/components/organization/social_icons";
import { fetchPosts } from "@/lib/posts";
import { fetchEvents } from "@/lib/events";
import { getMemberships } from "@/lib/memberships";
import { createClient, getUser } from "@/lib/supabase/server";
import { InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { ToastContainer } from "react-toastify";
import Link from "next/link";

const orgdata = [
  {
    name: "Lorem Ipsum",
    members: "123",
    posts: "132",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    facebook: "#",
    twitter: "#",
    instagram: "#",
    image: "https://via.placeholder.com/150",
  },
];

const getInitials = (name) => {
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

  console.log("slug:", slug);

  // ! GET Request on Get Organization by Slug, then display the data, pass it to the nested components

  const supabase = createClient();

  let { data: org, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  // Inside your component
  const currentPage = 1; // Set the current page
  const postsPerPage = 6; // Set the number of posts per page

  // Fetch organization posts
  const { data: posts, error: postsError } = await fetchPosts(
    org.organizationid,
    currentPage,
    postsPerPage
  );

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
            <div className="flex flex-col items-center sm:flex-row sm:justify-between">
              <div className="h-24 w-24 rounded-xl border-4 border-primary sm:h-32 sm:w-32">
                {org.photo ? (
                  <img
                    src={`${supabaseStorageBaseUrl}/${org?.photo}`}
                    alt={`${org?.name} logo`}
                    className="h-full w-full rounded-lg"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-zinc-200">
                    <span className="text-5xl text-zinc-800">
                      {getInitials(org.name)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 sm:mt-0">
                <Link
                  className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primarydark"
                  href={`${slug}/settings`}
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-4 px-5 sm:mt-16 lg:mt-24">
            <h1 className="text-2xl font-bold text-light sm:text-3xl">{org?.name}</h1>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center">
              <div className="mb-2 flex items-center sm:mb-0 sm:mr-4">
                <UserGroupIcon className="mr-1 h-5 w-5 text-primary" />
                <p className="text-sm text-light">Members: {orgdata[0].members}</p>
              </div>
              <div className="flex items-center">
                <InboxIcon className="mr-1 h-5 w-5 text-primary" />
                <p className="text-sm text-light">Posts: {orgdata[0].posts}</p>
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
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
