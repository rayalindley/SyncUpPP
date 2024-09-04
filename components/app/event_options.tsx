"use client";
import Preloader from "@/components/preloader";
import { deleteEvent, fetchRegisteredUsersForEvent } from "@/lib/events"; // Assuming you have deleteEvent function
import { check_permissions } from "@/lib/organization";
import { EventModel } from "@/models/eventModel";
import { UserProfileModel } from "@/models/userProfileModel";
import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import Image from "next/image";

const jsonTheme = {
  main: "line-height:1.3;color:#383a42;background:#ffffff;overflow:hidden;word-wrap:break-word;white-space: pre-wrap;word-wrap: break-word;",
  error:
    "line-height:1.3;color:#e45649;background:#ffffff;overflow:hidden;word-wrap:break-word;white-space: pre-wrap;word-wrap: break-word;",
  key: "color:#a626a4;", // Purple for keys to stand out
  string: "color:#50a14f;", // Green for strings for easy readability
  value: "color:#4078f2;", // Blue for values to differentiate from strings
  boolean: "color:#986801;", // Brown for booleans for quick identification
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// Function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
};

export default function EventOptions({
  selectedEvent,
  open,
  setOpen,
  userId,
}: {
  selectedEvent: EventModel;
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
}) {
  const [currentTab, setCurrentTab] = useState("Info");
  const [attendees, setAttendees] = useState<UserProfileModel[] | null>(null);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [canEditEvents, setCanEditEvents] = useState(false);
  const [canDeleteEvents, setCanDeleteEvents] = useState(false);

  const deleteBtn = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const response = await deleteEvent(selectedEvent.getEventId());

        if (!response.error) {
          Swal.fire({
            title: "Deleted!",
            text: "The event was successfully deleted.",
            icon: "success",
          }).then(() => {
            location.reload();
          });
        } else {
          Swal.fire({
            title: "Failed!",
            text: response.error.message,
            icon: "error",
          });
        }
      }
    });
  };

  // Define the base URL for your Supabase storage bucket
  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  // Function to format date to Philippine Standard Time
  const formattedDateTime = (utcDateString: string) => {
    const date = new Date(utcDateString);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const startEventDateTimePST = formattedDateTime(
    selectedEvent.getStartEventDateTime()?.toString()
  );
  const endEventDateTimePST = formattedDateTime(
    selectedEvent.getEndEventDateTime()?.toString()
  );
  const createdAtPST = formattedDateTime(
    selectedEvent.getCreatedAt()?.toString() || "N/A"
  );
  const isUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const locationContent = isUrl(selectedEvent.getLocation()) ? (
    <a
      href={selectedEvent.getLocation() ?? ""}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primarydark"
    >
      {selectedEvent.getLocation()}
    </a>
  ) : (
    selectedEvent.getLocation()
  );

  useEffect(() => {
    if (currentTab === "Attendees") {
      const fetchAttendees = async () => {
        setLoadingAttendees(true);
        const { users, error } = await fetchRegisteredUsersForEvent(
          selectedEvent.getEventId()
        );
        setLoadingAttendees(false);
        if (!error) {
          const userProfiles = users.map(
            (user: any) =>
              new UserProfileModel(
                user.userid,
                user.first_name,
                user.last_name,
                "",
                new Date(),
                "",
                "",
                user.profilepicture,
                "",
                new Date(),
                0
              )
          );
          setAttendees(userProfiles);
        } else {
          Swal.fire({
            title: "Error!",
            text: error.message,
            icon: "error",
          });
        }
      };
      fetchAttendees();
    }
  }, [currentTab, selectedEvent]);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const editPermission = await check_permissions(
          userId || "",
          selectedEvent.getOrganizationId() ?? "",
          "edit_events"
        );
        setCanEditEvents(editPermission);

        const deletePermission = await check_permissions(
          userId || "",
          selectedEvent.getOrganizationId() ?? "",
          "delete_events"
        );
        setCanDeleteEvents(deletePermission);
      } catch (error) {
        console.error("Failed to check permissions", error);
      }
    };

    checkPermissions();
  }, [userId, selectedEvent]);

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-charleston px-3 py-2 text-sm font-semibold text-light shadow-sm ring-1 ring-inset ring-[#525252] hover:bg-raisinblack">
            Options
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Menu.Items className="fixed right-[80px] z-[100] mt-2 w-56 origin-top-left divide-y divide-[#525252] rounded-md bg-charleston shadow-lg ring-1 ring-charleston ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex items-center px-4 py-2 text-sm"
                    )}
                    onClick={() => {
                      setCurrentTab("Info");
                      setOpen(true);
                    }}
                  >
                    <UserIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    View EventModel Info
                  </a>
                )}
              </Menu.Item>
              {canEditEvents && (
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      className={classNames(
                        active ? "bg-raisinblack text-light" : "text-light",
                        "group flex items-center px-4 py-2 text-sm"
                      )}
                      href={`/events/edit/${selectedEvent.getEventId()}`}
                    >
                      <FaRegEdit
                        className="mr-3 h-5 w-5 text-light group-hover:text-light"
                        aria-hidden="true"
                      />
                      Edit EventModel
                    </Link>
                  )}
                </Menu.Item>
              )}
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="#"
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex items-center px-4 py-2 text-sm"
                    )}
                    onClick={() => {
                      setCurrentTab("Attendees");
                      setOpen(true);
                    }}
                  >
                    <UsersIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    View Attendees
                  </a>
                )}
              </Menu.Item>
            </div>
            <div className="py-1">
              {canDeleteEvents && (
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={classNames(
                        active ? "bg-raisinblack text-light" : "text-light",
                        "group flex items-center px-4 py-2 text-sm"
                      )}
                      onClick={deleteBtn}
                    >
                      <TrashIcon
                        className="mr-3 h-5 w-5 text-light group-hover:text-light"
                        aria-hidden="true"
                      />
                      Delete EventModel
                    </a>
                  )}
                </Menu.Item>
              )}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-auto">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-xl">
                    <div className="flex h-full flex-col overflow-y-scroll bg-eerieblack py-6 shadow-xl">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-light">
                            View EventModel Info
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md text-gray-400 hover:text-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              onClick={() => setOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-gray-700">
                        <nav
                          className="-mb-px flex space-x-8 px-4 sm:px-6"
                          aria-label="Tabs"
                        >
                          <button
                            onClick={() => setCurrentTab("Info")}
                            className={classNames(
                              currentTab === "Info"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300",
                              "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
                            )}
                          >
                            Info
                          </button>
                          <button
                            onClick={() => setCurrentTab("Attendees")}
                            className={classNames(
                              currentTab === "Attendees"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300",
                              "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
                            )}
                          >
                            Attendees
                          </button>
                        </nav>
                      </div>

                      <div className="relative mt-6 flex-1 flex-wrap overflow-hidden overflow-y-auto px-4 text-light sm:px-6">
                        {currentTab === "Info" && (
                          <>
                            {selectedEvent.getEventPhoto() ? (
                              <Image
                                src={`${supabaseStorageBaseUrl}/${selectedEvent.getEventPhoto()}`}
                                alt={`${selectedEvent.getTitle()} event photo`}
                                className="mx-auto h-60 w-full rounded-lg object-cover"
                                width={800}
                                height={600}
                              />
                            ) : (
                              <div className="mx-auto h-60 w-full rounded-lg bg-white" />
                            )}
                            <table className="w-full table-auto">
                              <tbody>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">Title:</td>
                                  <td className="p-2">{selectedEvent.getTitle()}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">
                                    Description:
                                  </td>
                                  <td className="p-2">
                                    {truncateText(selectedEvent.getDescription(), 100)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">
                                    Location:
                                  </td>
                                  <td className="p-2">{locationContent}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">
                                    Start EventModel Date Time:
                                  </td>
                                  <td className="p-2">{startEventDateTimePST}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">
                                    End EventModel Date Time:
                                  </td>
                                  <td className="p-2">{endEventDateTimePST}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">
                                    Capacity:
                                  </td>
                                  <td className="p-2">
                                    {selectedEvent.getCapacity() || "None"}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">
                                    Registration Fee:
                                  </td>
                                  <td className="p-2">
                                    {selectedEvent.getRegistrationFee()
                                      ? `Php ${selectedEvent.getRegistrationFee()}`
                                      : "None"}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">
                                    Created At:
                                  </td>
                                  <td className="p-2">{createdAtPST}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">
                                    Privacy:
                                  </td>
                                  <td className="p-2">{selectedEvent.getPrivacy()}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-bold text-gray-400">Tags:</td>
                                  <td className="flex flex-wrap gap-2 p-2 ">
                                    {selectedEvent.getTags()?.length
                                      ? selectedEvent.getTags()!.map((tag, index) => (
                                          <span
                                            key={index}
                                            className="mr-2 inline-block rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 transition duration-100 hover:scale-[1.05] hover:bg-gray-200"
                                          >
                                            {tag}
                                          </span>
                                        ))
                                      : "None"}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div className="mt-4 flex space-x-4">
                              <Link
                                href={`/e/${selectedEvent.getEventSlug()}`}
                                className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-white hover:bg-primarydark"
                              >
                                View EventModel
                              </Link>
                              {canEditEvents && (
                                <Link
                                  className="flex-1 rounded-md bg-charleston px-4 py-2 text-center text-white hover:bg-raisinblack"
                                  href={`/events/edit/${selectedEvent.getEventId()}`}
                                >
                                  Edit EventModel
                                </Link>
                              )}
                              {canDeleteEvents && (
                                <button
                                  onClick={deleteBtn}
                                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                        {currentTab === "Attendees" && (
                          <div className="space-y-4">
                            {loadingAttendees ? (
                              <Preloader />
                            ) : Array.isArray(attendees) && attendees.length > 0 ? (
                              attendees.map(
                                (attendee: UserProfileModel, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-3"
                                  >
                                    <div className="relative h-8 w-8 flex-shrink-0">
                                      <Image
                                        className="h-8 w-8 rounded-full object-cover"
                                        src={`${supabaseStorageBaseUrl}/${attendee.getProfilePicture()}`}
                                        alt={`${attendee.getFirstName()} ${attendee.getLastName()}`}
                                        width={32}
                                        height={32}
                                      />
                                    </div>
                                    <div>{`${attendee.getFirstName()} ${attendee.getLastName()}`}</div>
                                  </div>
                                )
                              )
                            ) : (
                              <div>No attendees registered for this event.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
