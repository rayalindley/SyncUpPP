"use client";
import { signOut } from "@/lib/auth";
import {
  fetchNotifications,
  markAllAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/types";
import { getUserProfileById } from "@/lib/user_actions";
import useSidebarStore from "@/store/use_sidebar_store";
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
  PencilSquareIcon
} from "@heroicons/react/24/outline";
import { type User } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

function classNames(...classes: any[]) {
  return classes?.filter(Boolean).join(" ");
}

function Header({ user }: { user: User }) {
  // console.log("Hello from Header.tsx");
  const notificationLinkRef = useRef(null);

  const { sidebarOpen, setSidebarOpen } = useSidebarStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  }));

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    // console.log("Calling fetchNotifications");
    const response = await fetchNotifications(user.id);

    if (response && response.data) {
      const { data, unreadCount } = response;

      const sortedData = data.sort((a, b) => {
        if (a.isread === b.isread) {
          return a.message.localeCompare(b.message);
        }
        return a.isread ? 1 : -1;
      });

      setNotifications(sortedData);
      setUnreadCount(unreadCount);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    const initializeNotifications = async () => {
      // console.log("Initializing notifications");
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
          (payload) => {
            // console.log("Received notification payload:", payload);
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
      isread: true,
    }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);

    const { success } = await markAllAsRead(user.id);
    if (!success) {
      loadNotifications();
    }
  };

  function getNotificationLink(notification: { type: any; path: any }) {
    switch (notification.type) {
      case "event":
      case "membership":
      case "membership_notif_for_admin":
      case "welcome":
      case "post":
      case "comment":
        return "/" + `${notification.path}`;
      case "payment":
        return null;
      default:
        return null;
    }
  }

  function getNotificationIcon(notification: { type: any }) {
    switch (notification.type) {
      case "event":
        return <CalendarIcon className="h-6 w-6 text-light" />;
      case "membership":
      case "membership_notif_for_admin":
        return <UserIcon className="h-6 w-6 text-light" />;
      case "welcome":
        return <HandRaisedIcon className="h-6 w-6 text-light" />;
      case "payment":
        return <CurrencyDollarIcon className="h-6 w-6 text-light" />;
      case "post":
        return <PencilSquareIcon className="h-6 w-6 text-light" />;
      case "comment":
        return <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-light" />;
      default:
        return <ExclamationCircleIcon className="h-6 w-6 text-light" />;
    }
  }

  const handleNotificationClick = async (notificationId: any) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.notificationid === notificationId
        ? { ...notification, isread: true }
        : notification
    );
    setNotifications(updatedNotifications);
    setUnreadCount((prevUnreadCount) => prevUnreadCount - 1);

    const { success } = await markNotificationAsRead(notificationId);
    if (!success) {
      loadNotifications();
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
        <div className="relative flex flex-1 items-center ">
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Menu as="div" className="relative">
            <Menu.Button className="p-3 text-gray-400 hover:text-gray-500">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute bottom-0 left-0 inline-flex h-4 w-4 -translate-y-7 translate-x-7 transform items-center justify-center rounded-full bg-[#32805c] text-xs font-semibold text-white">
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
                className="absolute right-0 z-10 w-96 origin-top-right overflow-hidden rounded-md bg-charleston shadow-lg ring-1 ring-light ring-opacity-5 focus:outline-none"
                style={{
                  maxHeight: "500px",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <div className="notification-container">
                  <div className="h-80 overflow-y-auto px-4 py-3">
                    <p className="mb-2 text-sm font-medium text-light">Notifications</p>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <a
                          key={notification.notificationid}
                          className={`my-1 flex items-center gap-x-2 rounded-lg px-4 py-2 hover:bg-[#525252] ${
                            notification.isread ? "bg-gray" : "bg-[#232323]"
                          } cursor-pointer`}
                          onClick={() => {
                            handleNotificationClick(notification.notificationid);
                            window.location.href =
                              getNotificationLink(notification) ?? "";
                          }}
                        >
                          <span className="text-sm leading-tight">
                            {getNotificationIcon(notification)}
                          </span>
                          <span
                            className="flex-1 text-xs leading-tight text-light"
                            dangerouslySetInnerHTML={{ __html: notification.message }}
                          />
                          <span className="w-1/5 flex-none text-right text-xs text-light">
                            {formatDistanceToNow(new Date(notification.created_on), {
                              addSuffix: true,
                            })}
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
            </Transition>
          </Menu>

          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200"
            aria-hidden="true"
          />

          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <img
                className="h-8 w-8 rounded-full bg-gray-50"
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
                  <p className="truncate text-sm font-medium text-light">{user.email}</p>
                </div>
                <div className="py-1">
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
      </div>
    </div>
  );
}

export default Header;
