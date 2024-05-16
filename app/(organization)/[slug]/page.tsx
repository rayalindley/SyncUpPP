import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TabsComponent from "@/components/organization/organization_view_tabs";
import SocialIcons from "@/components/organization/social_icons";
import { createClient, getUser } from "@/lib/supabase/server";
import { InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { getMemberships } from "@/lib/memberships";
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

  const memberships = await getMemberships(org.organizationid)

  // Assuming `org` is an object retrieved from your database that contains the social media links object
  const socials = org.socials || {}; // Use default empty object if `org.socials` is undefined or null

  const facebookLink = socials.facebook; // Access the Facebook link
  const twitterLink = socials.twitter; // Access the Twitter link
  const linkedinLink = socials.linkedin; // Access the LinkedIn link

  // Now you can use these links in your code as needed
  console.log("Facebook Link:", facebookLink);
  console.log("Twitter Link:", twitterLink);
  console.log("LinkedIn Link:", linkedinLink);
  console.log("Org ID:", org.organizationid)
  console.log("Memberships: ", memberships)


  return (
    <div>
      <Header user={user} />
      <ToastContainer />
      <main className="isolate flex justify-center sm:px-4 md:px-6 lg:px-80">
        <div className="relative">
          {/* White Rectangle */}
          <div className="relative rounded-xl bg-white p-8 shadow-lg sm:p-16 lg:p-40">
            {/* Circle */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 transform">
              <div>
                <img
                  src={org?.photo || "https://via.placeholder.com/150"}
                  alt={`${org?.name} logo`}
                  className="block h-32 w-32 rounded-full border-8 border-primary sm:h-40 sm:w-40 lg:h-44 lg:w-44"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
          {/* Content */}

          <div className="mt-8 min-w-[1265px] sm:mt-16 lg:mt-24">
            {/* min width to be modified */}
            <h1 className="text-center text-3xl font-bold text-light">{org?.name}</h1>
            <div className="mt-2 flex items-center justify-center">
              <UserGroupIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <p className="mr-4 text-sm text-light">Members: {orgdata[0].members}</p>
              <InboxIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <p className="text-sm text-light">Posts: {orgdata[0].posts}</p>
            </div>
            <SocialIcons
              facebook={facebookLink}
              twitter={twitterLink}
              linkedin={linkedinLink}
            />
            <div className="mt-4 px-4 text-center text-sm text-light sm:px-8 lg:px-10">
              {org.description}
            </div>
            <TabsComponent organizationid={org.organizationid} memberships = {memberships}/>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
