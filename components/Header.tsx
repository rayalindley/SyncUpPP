"use client";
import { signOut } from "@/lib/auth";
import { UserProfile } from "@/lib/types";
import { getUserProfileById } from "@/lib/userActions";
import { Dialog, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Features", href: "#features" },
  { name: "Community", href: "/organizations" }, // Updated href
  { name: "Events", href: "/events" },
  { name: "Contact Us", href: "#contactus" },
];

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Header({ user = null }: { user: User | null }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response = await getUserProfileById(user?.id || "");
      setUserProfile(response.data as UserProfile);
    };

    fetchUserProfile();
  }, [user]);
  const handleNavClick = (href: string) => {
    const landingPageUrl = "/"; // Update this with your landing page URL
    const targetSection = href.substring(1); // Remove the '#' from the href
    const redirectUrl = `${landingPageUrl}#${targetSection}`;
    window.location.href = redirectUrl;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const { hash } = window.location;
      if (hash) {
        handleNavClick(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-eerieblack">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex items-center lg:flex-1">
          <Link href="/">
            <div className="flex items-center">
              <div className="-m-1.5 p-1.5">
                <span className="sr-only">SyncUp</span>
                <img className="h-10 w-auto" src="/syncup.png" alt="" />
              </div>
              <div className="font text-l flex items-center px-2 font-semibold text-light">
                SyncUp
              </div>
            </div>
          </Link>
        </div>

        <div className="hidden justify-center lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={`${item.href}`} // Update the href to only include the section ID
              onClick={(e) => {
                e.preventDefault(); // Prevent default link behavior
                handleNavClick(item.href); // Call handleNavClick with the href
              }}
              className="text-sm font-semibold leading-6 text-light hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-x-6">
          {user ? (
            <div>
              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-10 w-10 rounded-full bg-gray-50 object-cover"
                    src={
                      userProfile?.profilepicture
                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${userProfile.profilepicture}`
                        : "/Portrait_Placeholder.png"
                    }
                    alt="Profile Picture"
                  />
                  <span className="hidden lg:flex lg:items-center">
                    <span
                      className="ml-4 text-sm font-semibold leading-6 text-light"
                      aria-hidden="true"
                    >
                      {userProfile?.first_name}
                    </span>
                    <ChevronDownIcon
                      className="ml-2 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-[#525252] rounded-md bg-charleston shadow-lg ring-1 ring-light ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3">
                      <p className="text-sm text-light">Signed in as</p>
                      <p className="truncate text-sm font-medium text-light">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={`/dashboard`}
                            className={classNames(
                              active ? "bg-[#383838] text-light" : "text-light",
                              "block px-4 py-2 text-sm"
                            )}
                          >
                            Dashboard
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={`/user/profile/${user?.id}`}
                            className={classNames(
                              active ? "bg-[#383838] text-light" : "text-light",
                              "block px-4 py-2 text-sm"
                            )}
                          >
                            My Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="#"
                            className={classNames(
                              active ? "bg-[#383838] text-light" : "text-light",
                              "block px-4 py-2 text-sm"
                            )}
                          >
                            Support
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="#"
                            className={classNames(
                              active ? "bg-[#383838] text-light" : "text-light",
                              "block px-4 py-2 text-sm"
                            )}
                          >
                            License
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={classNames(
                              active ? "bg-[#383838] text-light" : "text-light",
                              "block w-full px-4 py-2 text-left text-sm"
                            )}
                            onClick={async () => {
                              await signOut();
                            }}
                          >
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="hidden hover:text-primary lg:block lg:text-sm lg:font-semibold lg:leading-6 lg:text-light"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </nav>
      <Dialog
        as="div"
        className="lg:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center gap-x-6">
            <Link href="/">
              <div className="flex lg:flex-1 ">
                <div className="-m-1.5 p-1.5">
                  <span className="sr-only">SyncUp</span>
                  <img className="h-8 w-auto" src="syncup.png" alt="SyncUp Logo" />
                </div>
                <div className="font text-lg font-semibold text-light">SyncUp</div>
              </div>
            </Link>
            <Link
              href="/signup"
              className="ml-auto rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Sign up
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                <Link
                  href="/signin"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}
