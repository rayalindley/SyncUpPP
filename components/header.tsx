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
import { Dialog, Menu, Transition } from "@headlessui/react";
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
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { type User } from "@supabase/supabase-js";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { Notifications } from "@/types/notifications";

// Import the new NotificationDropdown and NotificationDialog components
import NotificationDropdown from "./dashboard/notification_dropdown";
import NotificationDialog from "./dashboard/notification_dialog";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Features", href: "#features" },
  { name: "Community", href: "/organizations" },
  { name: "Events", href: "/events" },
  { name: "Contact Us", href: "#contactus" },
];

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Header({ user = null }: { user: User | null }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const response = await getUserProfileById(user.id);
        setUserProfile(response.data as UserProfile);
      }
    };
    fetchUserProfile();
  }, [user]);

  // Load notifications
  const loadNotifications = async () => {
    if (!user) return; // Ensure user is logged in
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

  // Initialize notifications and subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient();
    const initializeNotifications = async () => {
      await loadNotifications(); // Load initial notifications
      if (user) {
        const notificationChannel = supabase
          .channel("notifications")
          .on(
            "postgres_changes",
            {
              event: "*", // Listen to all changes
              schema: "public",
              table: "notifications",
              filter: `userid=eq.${user.id}`,
            },
            () => {
              loadNotifications(); // Reload notifications on change
            }
          )
          .subscribe();
        return () => {
          notificationChannel.unsubscribe(); // Clean up subscription
        };
      }
    };
    initializeNotifications();
  }, [user]);

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (user) {
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
    } else {
      alert("User is not logged in. Please log in to mark notifications as read.");
    }
  };

  // Handle individual notification click
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
      window.location.href = link;
    }
  };

  // Handle navigation clicks
  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const targetSection = href.substring(1);
      const redirectUrl = `/#${targetSection}`;
      window.location.href = redirectUrl;
    } else {
      window.location.href = href;
    }
  };

  // Handle hash changes for smooth scrolling/navigation
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

  return (
    <header className="bg-eerieblack">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-6 lg:px-8"
        aria-label="Global"
      >
        {/* Logo and Branding */}
        <div className="flex items-center lg:flex-1">
          <Link href="/">
            <div className="flex items-center">
              <div className="-m-1.5 p-1.5">
                <span className="sr-only">SyncUp</span>
                <img className="h-10 w-auto" src="/syncup.png" alt="SyncUp Logo" />
              </div>
              <div className="font text-l flex items-center px-2 font-semibold text-light">
                SyncUp
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden justify-center lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.href);
              }}
              className="text-sm font-semibold leading-6 text-light hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Side - Notifications and User Menu */}
        <div className="flex flex-1 items-center justify-end gap-x-6">
          {user ? (
            <div className="flex items-center">
              {/* Notification Dropdown */}
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllAsRead={handleMarkAllAsRead}
                onNotificationClick={handleNotificationClick}
                getNotificationLink={(notification) => {
                  if (!notification.path) return null;
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
                      return (
                        <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-pink-500" />
                      );

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
                onViewAllNotifications={() => setIsNotificationDialogOpen(true)}
              />

              {/* Notification Dialog */}
              <NotificationDialog
                isOpen={isNotificationDialogOpen}
                onClose={setIsNotificationDialogOpen}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                getNotificationLink={(notification) => {
                  if (!notification.path) return null;
                  switch (notification.type) {
                    case "event":
                    case "event_update":
                    case "event_registration":
                      return `/e/${notification.path}`;
                    case "event_cancellation":
                    case "membership":
                    case "membership_expiring":
                    case "membership_expiring_today":
                    case "welcome":
                    case "new_member":
                    case "post":
                    case "post_deletion":
                    case "comment":
                    case "comment_deletion":
                    case "payment":
                    case "payment_failure":
                    case "organization_request":
                    case "organization_request_update":
                    case "role_change":
                    case "member_removal":
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
                      return <BellIcon className="h-6 w-6 text-blue-500" />;
                    case "membership":
                    case "membership_expiring":
                    case "membership_expiring_today":
                      return <BellIcon className="h-6 w-6 text-green-500" />;
                    case "welcome":
                      return <BellIcon className="h-6 w-6 text-purple-500" />;
                    case "payment":
                      return <BellIcon className="h-6 w-6 text-yellow-500" />;
                    case "post":
                      return <BellIcon className="h-6 w-6 text-indigo-500" />;
                    case "comment":
                      return <BellIcon className="h-6 w-6 text-pink-500" />;
                    case "payment_failure":
                      return <BellIcon className="h-6 w-6 text-red-500" />;
                    case "organization_request":
                      return <BellIcon className="h-6 w-6 text-teal-500" />;
                    case "organization_request_update":
                      return <BellIcon className="h-6 w-6 text-orange-500" />;
                    case "role_change":
                      return <BellIcon className="h-6 w-6 text-indigo-600" />;
                    case "new_member":
                      return <BellIcon className="h-6 w-6 text-green-600" />;
                    case "member_removal":
                      return <BellIcon className="h-6 w-6 text-gray-500" />;
                    case "comment_deletion":
                    case "post_deletion":
                      return <BellIcon className="h-6 w-6 text-gray-400" />;
                    default:
                      return <BellIcon className="h-6 w-6 text-gray-500" />;
                  }
                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />

              {/* Divider */}
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
                  <Menu.Items className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-[#151718] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/support"
                            className={classNames(
                              active ? "bg-[#23af90] text-white" : "text-gray-300",
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
                              active ? "bg-[#23af90] text-white" : "text-gray-300",
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
                              active ? "bg-[#23af90] text-white" : "text-gray-300",
                              "block px-4 py-2 text-sm"
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

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <Dialog as="div" className="lg:hidden" open={sidebarOpen} onClose={setSidebarOpen}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center gap-x-6">
            <Link href="/">
              <div className="flex lg:flex-1 ">
                <div className="-m-1.5 p-1.5">
                  <span className="sr-only">SyncUp</span>
                  <img className="h-8 w-auto" src="/syncup.png" alt="SyncUp Logo" />
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
              onClick={() => setSidebarOpen(false)}
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
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                      setSidebarOpen(false); // Close the menu after navigation
                    }}
                    className="-mx-3 block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-light hover:bg-primary"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                {user ? (
                  <>
                    <Link
                      href={`/dashboard`}
                      className="-mx-3 block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-light hover:bg-primary"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={`/user/profile/${user.id}`}
                      className="-mx-3 block rounded-lg px-3 py-2 text-sm font-semibold leading-6 text-light hover:bg-primary"
                    >
                      My Profile
                    </Link>
                    <button
                      className="-mx-3 block w-full rounded-lg px-3 py-2 text-left text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={async () => {
                        await signOut();
                        setSidebarOpen(false);
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      Log in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}
