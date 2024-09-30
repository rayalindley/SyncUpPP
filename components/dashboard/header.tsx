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
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Bars3Icon,
  UserIcon,
  HandRaisedIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  UserPlusIcon,
  UserMinusIcon,
  TrashIcon,
  CalendarIcon,
  BellIcon,
} from "@heroicons/react/20/solid";
import { User } from "@supabase/supabase-js";
import { addHours } from "date-fns";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { Notifications } from "@/types/notifications";
import NotificationDropdown from "./notification_dropdown";
import NotificationDialog from "./notification_dialog";
import { Menu, Transition } from "@headlessui/react";

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

function Header({ user }: { user: User }) {
  const { sidebarOpen, setSidebarOpen } = useSidebarStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  }));
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
      read: true,
    }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    const { success } = await markAllAsRead(user.id);
    if (!success) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notificationId: string, link: string | null) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.notificationid === notificationId
        ? { ...notification, read: true }
        : notification
    );
    setNotifications(updatedNotifications);
    setUnreadCount((prevUnreadCount) => (prevUnreadCount > 0 ? prevUnreadCount - 1 : 0));
    const { success } = await markNotificationAsRead(notificationId);
    if (!success) {
      loadNotifications();
    }
    if (link) {
      console.log("Navigating to:", link); // Debugging line
      window.location.href = link; // Use window.location.href for navigation
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
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#151718] bg-[#151718] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Sidebar Toggle Button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-[#23af90] hover:text-[#23af90] lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      {/* Vertical Divider (Hidden on Large Screens) */}
      <div className="h-6 w-px bg-[#151718] lg:hidden" aria-hidden="true" />
      {/* Main Content Area */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center"></div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notification Dropdown */}
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllAsRead={handleMarkAllAsRead}
            onNotificationClick={handleNotificationClick}
            getNotificationLink={(notification) => {
              if (!notification.path) return null;
              const sanitizedPath = notification.path.startsWith("/")
                ? notification.path.slice(1)
                : notification.path;
              switch (notification.type) {
                case "event":
                case "event_update":
                case "event_registration":
                case "payment_event":
                  return `/e/${notification.path}`;
                case "payment_membership":
                case "membership":
                case "membership_expiring":
                case "membership_expiring_today":
                  return `${notification.path}?tab=membership`;
                case "event_cancellation":
                case "welcome":
                case "new_member":
                case "post":
                case "post_deletion":
                case "comment":
                case "comment_deletion":
                case "organization_request":
                case "organization_request_update":
                case "role_change":
                case "member_removal":
                case "payment":
                  return notification.path;
                default:
                  return null;
              }
            }}
            getNotificationIcon={(notification) => {
              switch (notification.type) {
                case "event":
                case "event_update":
                case "event_registration":
                  return <CalendarIcon className="h-6 w-6 text-blue-500" />;

                case "membership":
                case "membership_expiring":
                case "membership_expiring_today":
                  return <UserIcon className="h-6 w-6 text-green-500" />;

                case "event_cancellation":
                  return <CalendarIcon className="h-6 w-6 text-blue-500" />; // Same as event for now, or change if needed

                case "welcome":
                  return <HandRaisedIcon className="h-6 w-6 text-purple-500" />;

                case "new_member":
                  return <UserPlusIcon className="h-6 w-6 text-green-600" />;

                case "post":
                  return <PencilSquareIcon className="h-6 w-6 text-indigo-500" />;

                case "post_deletion":
                  return <TrashIcon className="h-6 w-6 text-gray-400" />;

                case "comment":
                  return <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-pink-500" />;

                case "organization_request":
                  return <UserGroupIcon className="h-6 w-6 text-teal-500" />;

                case "organization_request_update":
                  return <ArrowPathIcon className="h-6 w-6 text-orange-500" />;

                case "role_change":
                  return <CheckBadgeIcon className="h-6 w-6 text-indigo-600" />;

                case "member_removal":
                  return <UserMinusIcon className="h-6 w-6 text-gray-500" />;

                case "payment":
                case "payment_membership":
                case "payment_event":
                  return <CurrencyDollarIcon className="h-6 w-6 text-yellow-500" />;

                case "event_reminder":
                  return <BellIcon className="h-6 w-6 text-blue-400" />;

                default:
                  return <ExclamationCircleIcon className="h-6 w-6 text-gray-500" />;
              }
            }}
            onViewAllNotifications={() => setIsNotificationDialogOpen(true)} // Pass the handler
          />
          {/* Notification Dialog */}
          <NotificationDialog
            isOpen={isNotificationDialogOpen}
            onClose={setIsNotificationDialogOpen}
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            getNotificationLink={(notification) => {
              if (!notification.path) return null;
              const sanitizedPath = notification.path.startsWith("/")
                ? notification.path.slice(1)
                : notification.path;
              switch (notification.type) {
                case "event":
                case "event_update":
                case "event_registration":
                case "payment_event":
                  return `/e/${notification.path}`;
                case "payment_membership":
                case "membership":
                case "membership_expiring":
                case "membership_expiring_today":
                  return `${notification.path}?tab=membership`;
                case "event_cancellation":
                case "welcome":
                case "new_member":
                case "post":
                case "post_deletion":
                case "comment":
                case "comment_deletion":
                case "organization_request":
                case "organization_request_update":
                case "role_change":
                case "member_removal":
                case "payment":
                  return notification.path;
                default:
                  return null;
              }
            }}
            getNotificationIcon={(notification) => {
              switch (notification.type) {
                case "event":
                case "event_update":
                case "event_registration":
                case "event_cancellation":
                  return <CalendarIcon className="h-6 w-6 text-blue-500" />;
                case "membership":
                case "membership_expiring":
                case "membership_expiring_today":
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
                case "member_removal":
                  return <UserMinusIcon className="h-6 w-6 text-gray-500" />;
                case "comment_deletion":
                case "post_deletion":
                  return <TrashIcon className="h-6 w-6 text-gray-400" />;
                default:
                  return <ExclamationCircleIcon className="h-6 w-6 text-gray-500" />;
              }
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
          {/* Vertical Divider (Hidden on Large Screens) */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-[#151718]"
            aria-hidden="true"
          />
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
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-md bg-[#151718] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {/* Menu Items */}
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href={`/user/profile/${user.id}`}
                        className={classNames(
                          active ? "bg-[#23af90] text-white" : "text-gray-300",
                          "block px-4 py-2 text-sm"
                        )}
                      >
                        My Profile
                      </Link>
                    )}
                  </Menu.Item>
                  {/* Added Dashboard Link */}
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/dashboard"
                        className={classNames(
                          active ? "bg-[#23af90] text-white" : "text-gray-300",
                          "block px-4 py-2 text-sm"
                        )}
                      >
                        Dashboard
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
                          active ? "bg-[#23af90] text-white" : "text-gray-300",
                          "block w-full px-4 py-2 text-left text-sm"
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
