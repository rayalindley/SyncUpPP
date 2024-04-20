import Header from "@/components/Header";
import { getUser } from "@/lib/supabase/server";
import { InboxIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { CiFacebook, CiInstagram, CiTwitter } from "react-icons/ci";

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

export default async function OrganizationUserView() {
  const { user } = await getUser();

  return (
    <div>
      <Header user={user} />

      <main className="isolate flex justify-center sm:px-4 md:px-6 lg:px-8">
        <div className="relative">
          {/* White Rectangle */}
          <div className="relative rounded-xl bg-white p-8 shadow-lg sm:p-16 lg:p-24">
            {/* Circle */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 transform">
              <div>
                <img
                  src={orgdata[0].image}
                  alt="Profile Picture"
                  className="block h-32 w-32 rounded-full border-8 border-primary sm:h-40 sm:w-40 lg:h-44 lg:w-44"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="mt-8 sm:mt-16 lg:mt-24">
            <h1 className="text-center text-3xl font-bold text-light">
              {orgdata[0].name}
            </h1>
            <div className="mt-2 flex items-center justify-center">
              <UserGroupIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <p className="mr-4 text-sm text-light">Members: {orgdata[0].members}</p>
              <InboxIcon className="mr-1 h-4 w-4 text-primary sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <p className="text-sm text-light">Posts: {orgdata[0].posts}</p>
            </div>
            <div className="mt-4 flex justify-center sm:mt-6 lg:mt-8">
              <a href={orgdata[0].facebook} className="mr-4 text-blue-500">
                <CiFacebook className="inline-block h-8 w-8 text-light hover:text-gray-500 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
              </a>
              <a href={orgdata[0].twitter} className="mr-4 text-blue-500">
                <CiTwitter className="inline-block h-8 w-8 text-light hover:text-gray-500 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
              </a>
              <a href={orgdata[0].instagram} className="text-blue-500">
                <CiInstagram className="inline-block h-8 w-8 text-light hover:text-gray-500 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
              </a>
            </div>
            <p className="mt-6 px-4 text-center text-sm text-light sm:px-8 lg:px-10">
              {orgdata[0].description}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
