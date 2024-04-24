import Footer from "@/components/Footer";
import Header from "@/components/Header";
import OrganizationCard from "@/components/app/OrganizationCard";
import { getUser } from "@/lib/supabase/server";
import { InboxIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { CiFacebook, CiInstagram, CiTwitter } from "react-icons/ci";

interface Organization {
  name: string;
  description: string;
  image: string;
}

const orgdata: Organization[] = [
  {
    name: "Lorem Ipsum",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    image: "https://picsum.photos/300/200",
  },
  {
    name: "Dolor Sit Amet",
    description:
      "Dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    image: "https://picsum.photos/300/200",
  },
  {
    name: "Consectetur Adipiscing",
    description:
      "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
    image: "https://picsum.photos/300/200",
  },
  {
    name: "Consectetur Adipiscing",
    description:
      "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
    image: "https://picsum.photos/300/200",
  },
  {
    name: "Consectetur Adipiscing",
    description:
      "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
    image: "https://picsum.photos/300/200",
  },
  {
    name: "Consectetur Adipiscing",
    description:
      "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
    image: "https://picsum.photos/300/200",
  },
];

export default async function OrganizationUserView() {
  const { user } = await getUser();

  return (
    <div>
      <Header user={user} />
      <main className="isolate flex justify-center sm:px-4 md:px-6 lg:px-80">
        <div className="relative">
          <div className="mt-4 sm:mt-16 lg:mt-24">
            <h1 className="text-center text-3xl font-bold text-light">Organizations</h1>
            <div className="mt-2 flex items-center justify-center"></div>
            <div className="mt-4 px-4 text-center text-sm text-light sm:px-8 lg:px-10">
              <p>
                Dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            <form className="max-w-8xl mx-auto mt-6 flex items-center">
              <label htmlFor="voice-search" className="sr-only">
                Search
              </label>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3"></div>
                <input
                  type="text"
                  id="search"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 ps-5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500  dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="Search for Organizations..."
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 end-0 flex items-center pe-3"
                ></button>
              </div>
              <button
                type="submit"
                className="ms-2 inline-flex items-center rounded-lg border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                <svg
                  className="me-2 h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
                Search
              </button>
            </form>
            <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-[-5rem] sm:grid-cols-3">
              {orgdata.map((org, index) => (
                <OrganizationCard
                  key={index}
                  name={org.name}
                  description={org.description}
                  photo={org.image}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
