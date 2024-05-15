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
import {
  fetchNotifications,
  markAllAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";
import {
  CalendarIcon,
  ExclamationCircleIcon,
  UserIcon,
  CashIcon, // Assuming you have a cash icon for payment notifications
  HandIcon, // Assuming you have a hand icon for welcome notifications
} from "@heroicons/react/24/outline";

function classNames(...classes: any[]) {
  return classes?.filter(Boolean).join(" ");
}

function Header({ user }: { user: User }) {
  const { sidebarOpen, setSidebarOpen } = useSidebarStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  }));

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // notifications block starts

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
      // Set all notifications as read
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        isread: true,
      }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    }
  };

  //types to be added: welcome, payment

  // This function returns the appropriate link for a notification.
  function getNotificationLink(notification) {
    switch (notification.type) {
      case "event":
        return "/" + `#`;
      case "membership":
        return "/" + `${notification.path}`;
      case "welcome":
        return "/" + `${notification.path}`;
      case "payment":
        return "/" + `#`;
      default:
        return "/" + `#`; // Default link if no specific type is matched
    }
  }

  // This function returns a Heroicon component based on the notification type.
  function getNotificationIcon(notification) {
    switch (notification.type) {
      case "event":
        return <CalendarIcon className="h-6 w-6 text-light" />;
      case "membership":
        return <UserIcon className="h-6 w-6 text-light" />;
      case "welcome":
        return <HandIcon className="h-6 w-6 text-light" />; // Replace with the correct icon for welcome
      case "payment":
        return <CashIcon className="h-6 w-6 text-light" />; // Replace with the correct icon for payment
      default:
        return <ExclamationCircleIcon className="h-6 w-6 text-light" />; // Default icon if no specific type is matched
    }
  }

  const handleNotificationClick = async (notificationId) => {
    // Call the API to mark the notification as read
    const { success } = await markNotificationAsRead(notificationId);
    if (success) {
      // Update the state to reflect the change
      const updatedNotifications = notifications.map((notification) =>
        notification.notificationid === notificationId
          ? { ...notification, isread: true }
          : notification
      );
      setNotifications(updatedNotifications);
      // Decrement the unread count
      setUnreadCount((prevUnreadCount) => prevUnreadCount - 1);
    }
  };

  // notifications block ends

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
              {/* notifications menu */}

              <Menu.Items className="absolute right-0 z-10 mt-3 w-96 origin-top-right overflow-hidden rounded-md bg-charleston shadow-lg ring-1 ring-light ring-opacity-5 focus:outline-none">
                <div className="max-h-[32rem] overflow-y-auto">
                  <div className="px-4 py-3">
                    <p className="mb-2 text-sm font-medium text-light">Notifications</p>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <a
                          key={notification.notificationid}
                          href={getNotificationLink(notification)} // This should now return something like '/linkhere'
                          className={`my-1 flex items-center gap-x-2 rounded-lg px-4 py-2 hover:bg-[#525252] ${notification.isread ? "bg-gray" : "bg-[#232323]"}`}
                          onClick={(e) => {
                            handleNotificationClick(notification.notificationid);
                          }}
                        >
                          <span className="text-sm leading-tight">
                            {getNotificationIcon(notification)}
                          </span>
                          <span
                            className="flex-1 text-xs leading-tight text-light"
                            dangerouslySetInnerHTML={{ __html: notification.message }}
                          />
                          <span className="text-xs text-light">
                            {/* Timestamp here */}
                          </span>
                        </a>
                      ))
                    ) : (
                      <p className="text-xs text-light">No new notifications.</p>
                    )}
                  </div>
                </div>
                <div className="border-t border-[#525252]">
                  <button
                    className="my-3 block w-full text-center text-sm text-[#32805c] hover:text-[#285a47]"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </button>
                </div>
              </Menu.Items>

              {/* notifications block ends */}
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
