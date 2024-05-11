"use client";
import { signOut } from "@/lib/auth";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";

import { UserProfile } from "@/lib/types";
import { getUserProfileById } from "@/lib/userActions";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import { type User } from "@supabase/supabase-js";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import useSidebarStore from "@/store/useSidebarStore";
import { fetchNotifications, markAllAsRead } from "@/lib/notifications";

function classNames(...classes: any[]) {
  return classes?.filter(Boolean).join(" ");
}

function Header({ user }: { user: User }) {
  const { sidebarOpen, setSidebarOpen } = useSidebarStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  }));

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      const { data, unreadCount } = await fetchNotifications(user.id);
      //console.log("Notifications:", data);
      setNotifications(data);
      setUnreadCount(unreadCount);
    };

    loadNotifications();
  }, [user]);

  const handleMarkAllAsRead = async () => {
    const { success } = await markAllAsRead(user.id);
    if (success) {
      setUnreadCount(0);
      // Update notifications state if needed
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response = await getUserProfileById(user?.id);
      setUserProfile(response.data as UserProfile);
    };

    fetchUserProfile();
  }, [user]);

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#525252] bg-eerieblack px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="placeholder:text-gray-400k block h-full w-full border-0 bg-eerieblack py-0 pl-8 pr-0 text-light focus:ring-0 sm:text-sm"
            placeholder="Search..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Menu as="div" className="relative">
            <Menu.Button className="p-3 text-gray-400 hover:text-gray-500">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 inline-flex h-2 w-2 -translate-y-1/2 translate-x-1/2 transform rounded-full bg-[#32805c]"></span>
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-3 w-80 origin-top-right overflow-hidden rounded-md bg-charleston shadow-lg ring-1 ring-light ring-opacity-5 focus:outline-none">
                <div className="max-h-96 overflow-y-auto">
                  <div className="px-4 py-3">
                    <p className="mb-2 text-sm font-medium text-light">Notifications</p>
                    {notifications.length > 0 ? (
                      notifications?.map((notification) => (
                        <div
                          key={notification.notificationid}
                          className={`flex flex-col gap-y-1 px-4 py-2 ${!notification.isread ? "bg-gray" : "bg-[#1c1c1c]"} hover:bg-[#525252] rounded-lg`}
                        >
                          <span
                            className={`text-sm leading-tight ${!notification.isread ? "font-bold text-light" : "text-light"}`}
                          >
                            {notification.message}
                          </span>
                          <span className="text-xs text-light">
                            {/* Timestamp here */}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-light">No new notifications.</p>
                    )}
                  </div>
                </div>
                <div className="border-t border-[#525252]">
                  <Link
                    href="#"
                    className="my-3 block text-center text-sm text-[#32805c] hover:text-[#285a47] focus:outline-none focus:ring-2 focus:ring-[#32805c] focus:ring-offset-2"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Link>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <img
                className="h-8 w-8 rounded-full bg-gray-50"
                src={
                  userProfile?.profilepicture
                    ? userProfile.profilepicture
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
                  <p className="truncate text-sm font-medium text-light">{user.email}</p>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href={`/user/edit/${user?.id}`}
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
      </div>
    </div>
  );
}

export default Header;
