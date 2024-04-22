import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getUser } from "@/lib/supabase/server";
import { InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { CiFacebook, CiInstagram, CiTwitter } from "react-icons/ci";

const orgdata = [
  {
    name: "Lorem Ipsum",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    facebook: "#",
    twitter: "#",
    instagram: "#",
    image: "https://via.placeholder.com/150",
  },
];

export default async function OrganizationUserView() {
  const { user } = await getUser();

  return (
    <div>
      <Header user={user} />
      <main className="isolate flex justify-center sm:px-4 md:px-6 lg:px-80">
        <div className="relative">
          <div className="mt-8 sm:mt-16 lg:mt-24">
            <h1 className="text-center text-3xl font-bold text-light">Organizations</h1>
            <div className="mt-2 flex items-center justify-center"></div>
            <div className="mt-4 px-4 text-center text-sm text-light sm:px-8 lg:px-10">
              {orgdata[0].description}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
