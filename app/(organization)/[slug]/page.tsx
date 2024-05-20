import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TabsComponent from "@/components/organization/organization_view_tabs";
import SocialIcons from "@/components/organization/social_icons";
import { fetchEvents } from "@/lib/events";
import { getMemberships } from "@/lib/memberships";
import { createClient, getUser } from "@/lib/supabase/server";
import { InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { ToastContainer } from "react-toastify";

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

  const memberships = await getMemberships(org.organizationid);

  // Assuming `org` is an object retrieved from your database that contains the social media links object
  const socials = org.socials || {}; // Use default empty object if `org.socials` is undefined or null

  const facebookLink = socials.facebook; // Access the Facebook link
  const twitterLink = socials.twitter; // Access the Twitter link
  const linkedinLink = socials.linkedin; // Access the LinkedIn link

  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public";

  return (
    <div>
      <Header user={user} />
      <ToastContainer />
      <main className="isolate flex justify-center sm:px-4 md:px-6 lg:px-80 ">
        <div className="relative max-w-7xl">
          {/* White Rectangle */}
          {/* <div className="relative rounded-2xl bg-white p-8 shadow-lg sm:p-16 lg:p-40"></div> */}
          <img
            src={
              `${supabaseStorageBaseUrl}/${org?.banner}` ||
              "https://via.placeholder.com/150"
            }
            alt={`${org?.name} logo`}
            className="h-80 w-full rounded-lg"
            style={{ objectFit: "cover" }}
          />
          <div className="absolute w-full -translate-y-1/2 transform px-5">
            <div className="flex w-full transform items-end justify-between">
              <div className="block h-36 w-36 rounded-xl border-4 border-primary sm:h-32 sm:w-32">
                <img
                  src={
                    `${supabaseStorageBaseUrl}/${org?.photo}` ||
                    "https://via.placeholder.com/150"
                  }
                  alt={`${org?.name} logo`}
                  className="h-full w-full rounded-lg"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div>
                <button className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primarydark">
                  Settings
                </button>
              </div>
            </div>
          </div>
          {/* Content */}

          <div className="mt-8 space-y-4 px-5 sm:mt-16 lg:mt-24">
            {/* min width to be modified */}
            <h1 className="text-3xl font-bold text-light">{org?.name}</h1>
            <div className="mt-2 flex ">
              <UserGroupIcon className="mr-1 h-5 w-5 text-primary " />
              <p className="mr-4 text-sm text-light">Members: {orgdata[0].members}</p>
              <InboxIcon className="mr-1 h-5 w-5 text-primary " />
              <p className="text-sm text-light">Posts: {orgdata[0].posts}</p>
            </div>
            <div className="mt-4text-sm text-light ">{org.description}</div>
            <SocialIcons
              facebook={facebookLink}
              twitter={twitterLink}
              linkedin={linkedinLink}
            />
            <TabsComponent
              organizationid={org.organizationid}
              memberships={memberships}
              events={events}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
