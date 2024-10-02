"use client";

import { Dialog, Transition, Menu } from "@headlessui/react";
import { Fragment } from "react";
import {
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { Notifications } from "@/types/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  notifications: Notifications[];
  onNotificationClick: (notificationId: string, link: string | null) => void;
  getNotificationLink: (notification: Notifications) => string | null;
  getNotificationIcon: (notification: Notifications) => JSX.Element;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string | null;
  setFilterType: (type: string | null) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
}

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  getNotificationLink,
  getNotificationIcon,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  sortOrder,
  setSortOrder,
}) => {
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

  const notificationTypes = [
    "event",
    "membership",
    "payment",
    "comment",
    "post",
    "welcome",
    "role_change",
    "organization_request",
    "event_update",
    "event_registration",
    "event_cancellation",
    "membership_expiring",
    "membership_expiring_today",
    "new_member",
    "post_deletion",
    "comment_deletion",
    "payment_failure",
    "organization_request_update",
    "member_removal",
  ];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => onClose(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform rounded-lg bg-charleston text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                {/* Header */}
                <div className="flex items-center justify-between divide-[#525252] border-b px-6 py-4">
                  <span className="text-xl font-semibold text-light">
                    All Notifications
                  </span>
                  <button
                    className="text-gray-400 hover:text-gray-200"
                    onClick={() => onClose(false)}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Search and Filters */}
                <div className="divide-[#525252] border-b px-6 py-4">
                  <div className="flex flex-col items-center gap-3 sm:flex-row">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        className="w-full rounded-md bg-charleston px-4 py-3 text-sm text-light placeholder-[#525252] focus:outline-none focus:ring-2 focus:ring-light"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute right-4 top-3">
                        <MagnifyingGlassIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    {/* Filter Dropdown */}
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center rounded-md bg-charleston px-4 py-3 text-sm text-light hover:bg-[#383838] focus:outline-none focus:ring-2 focus:ring-light">
                        Filter
                        <ChevronDownIcon
                          className="ml-2 h-5 w-5 text-gray-400"
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
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-[#151718] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setFilterType(null)}
                                  className={classNames(
                                    active ? "bg-[#23af90] text-white" : "text-gray-300",
                                    "block w-full px-4 py-2 text-left text-sm"
                                  )}
                                >
                                  All Types
                                </button>
                              )}
                            </Menu.Item>
                            {notificationTypes.map((type) => (
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

                    {/* Sort Dropdown */}
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center rounded-md bg-charleston px-4 py-3 text-sm text-light hover:bg-[#383838] focus:outline-none focus:ring-2 focus:ring-light">
                        Sort
                        <ChevronDownIcon
                          className="ml-2 h-5 w-5 text-gray-400"
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
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-[#151718] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setSortOrder("desc")}
                                  className={classNames(
                                    active ? "bg-[#23af90] text-white" : "text-gray-300",
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
                                    active ? "bg-[#23af90] text-white" : "text-gray-300",
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

                {/* Notifications List */}
                <div className="max-h-[500px] overflow-y-auto px-6 py-4">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => {
                      const link = getNotificationLink(notification);
                      return (
                        <div
                          key={notification.notificationid}
                          className={`mb-3 flex cursor-pointer items-start gap-4 rounded-lg p-3 hover:bg-[#383838] ${
                            notification.read ? "opacity-60" : ""
                          }`}
                          onClick={() =>
                            onNotificationClick(notification.notificationid, link)
                          }
                        >
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-light">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-light">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-light">
                              {formatDistanceToNow(new Date(notification.date_created), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-sm text-gray-400">
                      No notifications found.
                    </p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default NotificationDialog;
