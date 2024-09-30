// Filename: D:\Repos\SyncUp\components\dashboard\notification_dropdown.tsx

"use client";

import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { Notifications } from "@/types/notifications";
import { timeAgo } from "@/lib/utils"; // Imported timeAgo

interface NotificationDropdownProps {
  notifications: Notifications[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notificationId: string, link: string | null) => void;
  getNotificationLink: (notification: Notifications) => string | null;
  getNotificationIcon: (notification: Notifications) => JSX.Element;
  onViewAllNotifications: () => void;
}

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onNotificationClick,
  getNotificationLink,
  getNotificationIcon,
  onViewAllNotifications,
}) => {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-3 text-[#23af90] hover:text-[#23af90] focus:outline-none">
        <span className="sr-only">View notifications</span>
        <div className="relative">
          <BellIcon className="h-6 w-6 text-white" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>
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
          {/* Header Section */}
          <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="text-xs text-gray-400 hover:text-gray-200"
                onClick={onMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          {/* Notifications List */}
          <div className="px-4 py-2">
            {notifications.slice(0, 5).map((notification) => {
              const link = getNotificationLink(notification);
              return (
                <div
                  key={notification.notificationid}
                  className={`mb-2 flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-[#151718] ${
                    notification.read ? "opacity-50" : ""
                  }`}
                  onClick={() => onNotificationClick(notification.notificationid!, link)}
                >
                  <div className="flex-shrink-0">{getNotificationIcon(notification)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{notification.title}</p>
                    <p className="mt-1 text-xs text-gray-300">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {timeAgo(notification.date_created)} ago {/* Replaced formatDistanceToNow */}
                    </p>
                  </div>
                </div>
              );
            })}
            {notifications.length === 0 && (
              <p className="text-xs text-gray-400">No new notifications.</p>
            )}
          </div>
          {/* Footer Section */}
          <div className="border-t border-gray-700 px-4 py-2">
            <button
              className="cursor-pointer text-sm text-[#23af90] hover:underline"
              onClick={onViewAllNotifications}
            >
              View all notifications
            </button>
          </div>
        </Menu.Items>
      </Transition>
      <span className="mr-6"></span>
    </Menu>
  );
};

export default NotificationDropdown;
