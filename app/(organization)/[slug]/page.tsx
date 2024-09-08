import Footer from "@/components/footer";
import Header from "@/components/header";
import TabsComponent from "@/components/organization/organization_view_tabs";
import SocialIcons from "@/components/organization/social_icons";
import { fetchEvents } from "@/lib/events";
import { getMemberships } from "@/lib/memberships";
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

export default async function OrganizationUserView({ params, searchParams }: { params: { slug: string }; searchParams?: { [key: string]: string | string[] | undefined }; }) {
  const { user } = await getUser();
  const { slug } = params;
  const supabase = createClient();
  let { data: org, error } = await supabase.from("organization_summary").select("*").eq("slug", slug).single();
  let userOrgInfo = await getUserOrganizationInfo(user?.id!, org.organizationid);
  const currentPage = 1;
  const eventsPerPage = 6;
  const { data: events, error: eventsError } = await fetchEvents(org.organizationid, currentPage, eventsPerPage);
  const memberships = await getMemberships(org.organizationid);
  const socials = org?.socials || {};
  const facebookLink = socials.facebook;
  const twitterLink = socials.twitter;
  const linkedinLink = socials.linkedin;
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
                    <span className="text-5xl font-medium uppercase text-light">{getInitials(org.name)}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 sm:mt-0">
                {(await check_permissions(user?.id || "", org.organizationid, "view_dashboard")) && (
                  <Link className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primarydark" href={`${slug}/dashboard`}>
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
            <SocialIcons facebook={facebookLink} twitter={twitterLink} linkedin={linkedinLink} />
            <TabsComponent organizationid={org.organizationid} memberships={memberships} events={events} id={user?.id ?? ""} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
