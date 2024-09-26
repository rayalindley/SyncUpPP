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
import { Dialog, Menu, Transition } from "@headlessui/react";
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
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { User } from "@supabase/supabase-js";
import { addHours, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { Notifications } from "@/types/notifications";

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

  function getNotificationLink(notification: Notifications) {
    if (!notification.path) return null;

    switch (notification.type) {
      case "event":
      case "event_update":
      case "event_registration":
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
  }

  function getNotificationIcon(notification: Notifications) {
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
  }

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

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response = await getUserProfileById(user?.id);
      setUserProfile(response.data as UserProfile);
    };

    fetchUserProfile();
  }, [user.id]);

  const filteredNotifications = notifications
    .filter((notification) => {
      if (searchQuery) {
        return (
          notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .filter((notification) => {
      if (filterType) {
        return notification.type === filterType;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date_created).getTime();
      const dateB = new Date(b.date_created).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#151718] bg-[#151718] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-[#23af90] hover:text-[#23af90] lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="h-6 w-px bg-[#151718] lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center"></div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Menu as="div" className="relative">
            <Menu.Button className="relative p-3 text-[#23af90] hover:text-[#23af90] focus:outline-none">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Menu.Items
                className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-md bg-[#151718] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                style={{
                  maxHeight: "500px",
                  overflowY: "auto",
                }}
              >
                <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
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
                  {notifications.slice(0, 5).map((notification) => {
                    const link = getNotificationLink(notification);
                    return (
                      <div
                        key={notification.notificationid}
                        className={`mb-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-[#151718] ${
                          notification.read ? "opacity-50" : ""
                        }`}
                        onClick={() =>
                          handleNotificationClick(notification.notificationid!, link)
                        }
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
                              addHours(new Date(notification.date_created), 8),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {notifications.length === 0 && (
                    <p className="text-xs text-gray-400">No new notifications.</p>
                  )}
                </div>
                <div className="border-t border-gray-700 px-4 py-2">
                  <button
                    className="cursor-pointer text-sm text-[#23af90] hover:underline"
                    onClick={() => setIsNotificationDialogOpen(true)}
                  >
                    View all notifications
                  </button>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          <Transition.Root show={isNotificationDialogOpen} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50"
              onClose={setIsNotificationDialogOpen}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
              </Transition.Child>

              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  >
                    <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-[#151718] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
                        <span className="text-lg font-semibold text-white">
                          All Notifications
                        </span>
                        <button
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
                          onClick={() => setIsNotificationDialogOpen(false)}
                        >
                          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="border-b border-gray-700 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#23af90]"
                              placeholder="Search notifications..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute right-3 top-2">
                              <MagnifyingGlassIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </div>
                          </div>
                          <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#23af90]">
                              Filter
                              <ChevronDownIcon
                                className="ml-1 h-4 w-4 text-gray-400"
                                aria-hidden="true"
                              />
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-200"
                              enterFrom="opacity-0 translate-y-1"
                              enterTo="opacity-100 translate-y-0"
                              leave="transition ease-in duration-150"
                              leaveFrom="opacity-100 translate-y-0"
                              leaveTo="opacity-0 translate-y-1"
                            >
                              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-[#151718] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => setFilterType(null)}
                                        className={classNames(
                                          active
                                            ? "bg-[#23af90] text-white"
                                            : "text-gray-300",
                                          "block w-full px-4 py-2 text-left text-sm"
                                        )}
                                      >
                                        All Types
                                      </button>
                                    )}
                                  </Menu.Item>
                                  {[
                                    "event",
                                    "membership",
                                    "payment",
                                    "comment",
                                    "post",
                                    "welcome",
                                    "role_change",
                                    "organization_request",
                                  ].map((type) => (
                                    <Menu.Item key={type}>
                                      {({ active }) => (
                                        <button
                                          onClick={() => setFilterType(type)}
                                          className={classNames(
                                            active
                                              ? "bg-[#23af90] text-white"
                                              : "text-gray-300",
                                            "block w-full px-4 py-2 text-left text-sm"
                                          )}
                                        >
                                          {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ))}
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                          <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#23af90]">
                              Sort
                              <ChevronDownIcon
                                className="ml-1 h-4 w-4 text-gray-400"
                                aria-hidden="true"
                              />
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-200"
                              enterFrom="opacity-0 translate-y-1"
                              enterTo="opacity-100 translate-y-0"
                              leave="transition ease-in duration-150"
                              leaveFrom="opacity-100 translate-y-0"
                              leaveTo="opacity-0 translate-y-1"
                            >
                              <Menu.Items className="absolute right-0 mt-2 w-32 origin-top-right rounded-md bg-[#151718] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => setSortOrder("desc")}
                                        className={classNames(
                                          active
                                            ? "bg-[#23af90] text-white"
                                            : "text-gray-300",
                                          "block w-full px-4 py-2 text-left text-sm"
                                        )}
                                      >
                                        Newest
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => setSortOrder("asc")}
                                        className={classNames(
                                          active
                                            ? "bg-[#23af90] text-white"
                                            : "text-gray-300",
                                          "block w-full px-4 py-2 text-left text-sm"
                                        )}
                                      >
                                        Oldest
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto px-4 py-2">
                        {filteredNotifications.length > 0 ? (
                          filteredNotifications.map((notification) => {
                            const link = getNotificationLink(notification);
                            return (
                              <div
                                key={notification.notificationid}
                                className={`mb-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-[#151718] ${
                                  notification.read ? "opacity-50" : ""
                                }`}
                                onClick={() =>
                                  handleNotificationClick(
                                    notification.notificationid,
                                    link
                                  )
                                }
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
                                      addHours(new Date(notification.date_created), 8),
                                      { addSuffix: true }
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-gray-400">No notifications found.</p>
                        )}
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition.Root>

          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-[#151718]"
            aria-hidden="true"
          />

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
