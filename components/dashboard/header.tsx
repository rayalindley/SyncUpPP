// Filename: D:\Github\SyncUp\components\dashboard\header.tsx

"use client";
import { signOut } from "@/lib/auth";
import {
  fetchNotifications,
  markAllAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types/user_profile";
import { getUserProfileById } from "@/lib/user_actions";
import useSidebarStore from "@/store/useSidebarStore";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Bars3Icon,
  BellIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  HandRaisedIcon,
  UserIcon,
  ChatBubbleLeftEllipsisIcon,
  PencilSquareIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  UserPlusIcon,
  XMarkIcon,
  UserMinusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { type User } from "@supabase/supabase-js";
import { addHours, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { Notifications } from "@/types/notifications"; // Ensure correct import

function classNames(...classes: any[]) {
  return classes?.filter(Boolean).join(" ");
}

function Header({ user }: { user: User }) {
  const notificationLinkRef = useRef(null);

  const { sidebarOpen, setSidebarOpen } = useSidebarStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  }));

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notifications[]>([]); // Typed as Notifications[]
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    const response = await fetchNotifications(user.id);

    if (response && response.data) {
      const { data, unreadCount } = response;

      const sortedData = data.sort((a: Notifications, b: Notifications) => {
        if (a.read === b.read) {
          return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
        }
        return a.read ? 1 : -1;
      });

      setNotifications(sortedData);
      setUnreadCount(unreadCount);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const initializeNotifications = async () => {
      await loadNotifications();

      const notificationChannel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `userid=eq.${user.id}`,
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        notificationChannel.unsubscribe();
      };
    };

    initializeNotifications();
  }, [user.id]);

  const handleMarkAllAsRead = async () => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read: true, // Changed from isread
    }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);

    const { success } = await markAllAsRead(user.id);
    if (!success) {
      loadNotifications();
    }
  };

  function getNotificationLink(notification: Notifications) {
    switch (notification.type) {
      case "event":
      case "membership":
      case "welcome":
      case "post":
      case "comment":
      case "payment":
        return `/${notification.path}`;
      case "payment_failure":
      case "organization_request":
      case "organization_request_update":
      case "role_change":
      case "new_member":
      case "event_cancellation":
      case "member_removal":
      case "comment_deletion":
      case "post_deletion":
        return `/${notification.path}`; // Adjust paths as needed
      default:
        return null;
    }
  }

  function getNotificationIcon(notification: Notifications) {
    switch (notification.type) {
      case "event":
        return <CalendarIcon className="h-6 w-6 text-blue-500" />;
      case "membership":
        return <UserIcon className="h-6 w-6 text-green-500" />;
      case "welcome":
        return <HandRaisedIcon className="h-6 w-6 text-purple-500" />;
      case "payment":
        return <CurrencyDollarIcon className="h-6 w-6 text-yellow-500" />;
      case "post":
        return <PencilSquareIcon className="h-6 w-6 text-indigo-500" />;
      case "comment":
        return <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-pink-500" />;
      case "payment_failure":
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
      case "organization_request":
        return <UserGroupIcon className="h-6 w-6 text-teal-500" />;
      case "organization_request_update":
        return <ArrowPathIcon className="h-6 w-6 text-orange-500" />;
            case "role_change":
        return <CheckBadgeIcon className="h-6 w-6 text-indigo-600" />;
      case "new_member":
        return <UserPlusIcon className="h-6 w-6 text-green-600" />;
      case "event_cancellation":
        return <XMarkIcon className="h-6 w-6 text-red-600" />;
      case "member_removal":
        return <UserMinusIcon className="h-6 w-6 text-gray-500" />;
      case "comment_deletion":
        return <TrashIcon className="h-6 w-6 text-gray-400" />;
      case "post_deletion":
        return <TrashIcon className="h-6 w-6 text-gray-400" />;
      default:
        return <ExclamationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  }

  const handleNotificationClick = async (notificationId: string, link: string | null) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.notificationid === notificationId
        ? { ...notification, read: true } // Changed from isread
        : notification
    );
    setNotifications(updatedNotifications);
    setUnreadCount((prevUnreadCount) => (prevUnreadCount > 0 ? prevUnreadCount - 1 : 0));

    const { success } = await markNotificationAsRead(notificationId);
    if (!success) {
      loadNotifications();
    }

    if (link) {
      window.location.href = link;
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response = await getUserProfileById(user?.id);
      setUserProfile(response.data as UserProfile);
    };

    fetchUserProfile();
  }, [user.id]);

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-700 bg-eerieblack px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Sidebar Toggle Button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-300 hover:text-gray-400 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-700 lg:hidden" aria-hidden="true" />

      {/* Right Side */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Placeholder for any left-aligned items */}
        <div className="flex flex-1 items-center"></div>

        {/* Notification and User Menu */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button className="relative p-3 text-gray-300 hover:text-gray-400 focus:outline-none">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
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
              <Menu.Items
                className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                style={{
                  maxHeight: "500px",
                  overflowY: "auto",
                }}
              >
                <div className="py-2 px-4 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      className="text-xs text-gray-400 hover:text-gray-200"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="px-4 py-2">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => {
                      const link = getNotificationLink(notification);
                      return (
                        <div
                          key={notification.notificationid}
                          className={`flex items-start gap-3 p-2 rounded-lg mb-2 hover:bg-gray-700 cursor-pointer ${
                            notification.read ? "bg-gray-700" : "bg-gray-600"
                          }`}
                          onClick={() => handleNotificationClick(notification.notificationid, link)}
                        >
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-300">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {formatDistanceToNow(
                                addHours(new Date(notification.date_created), 8), // Adjust timezone if needed
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400">No new notifications.</p>
                  )}
                </div>
                {/* Optional: View All Notifications Link */}
                <div className="px-4 py-2 border-t border-gray-700">
                  <Link href="/notifications">
                    <a className="text-sm text-blue-500 hover:underline">View all notifications</a>
                  </Link>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Divider */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-700" aria-hidden="true" />

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <img
                className="h-8 w-8 rounded-full bg-gray-700"
                src={
                  userProfile?.profilepicture
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${userProfile.profilepicture}`
                    : "/Portrait_Placeholder.png"
                }
                alt="Profile Picture"
              />
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-3 text-sm font-semibold text-white"
                  aria-hidden="true"
                >
                  {userProfile?.first_name}
                </span>
                <ChevronDownIcon
                  className="ml-1 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
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
              <Menu.Items className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href={`/user/profile/${user.id}`}
                        className={classNames(
                          active ? "bg-gray-700 text-white" : "text-gray-300",
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
                        href="/support"
                        className={classNames(
                          active ? "bg-gray-700 text-white" : "text-gray-300",
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
                        href="/license"
                        className={classNames(
                          active ? "bg-gray-700 text-white" : "text-gray-300",
                          "block px-4 py-2 text-sm"
                        )}
                      >
                        License
                      </Link>
                    )}
                  </Menu.Item>
                </div>
                <div className="border-t border-gray-700"></div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={async () => {
                          await signOut();
                        }}
                        className={classNames(
                          active ? "bg-gray-700 text-white" : "text-gray-300",
                          "block w-full text-left px-4 py-2 text-sm"
                        )}
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
