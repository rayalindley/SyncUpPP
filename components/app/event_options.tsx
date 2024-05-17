"use client";
import { deleteEvent } from "@/lib/events"; // Assuming you have deleteEvent function
import { Dialog, Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, TrashIcon, UserIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/solid"; // Changed from XMarkIcon to XIcon
import Link from "next/link";
import { Fragment } from "react";
import { FaRegEdit } from "react-icons/fa";
import Swal from "sweetalert2";

const jsonTheme = {
  main: "line-height:1.3;color:#383a42;background:#ffffff;overflow:hidden;word-wrap:break-word;white-space: pre-wrap;word-wrap: break-word; ",
  error:
    "line-height:1.3;color:#e45649;background:#ffffff;overflow:hidden;word-wrap:break-word;white-space: pre-wrap;word-wrap: break-word; ",
  key: "color:#a626a4;", // Purple for keys to stand out
  string: "color:#50a14f;", // Green for strings for easy readability
  value: "color:#4078f2;", // Blue for values to differentiate from strings
  boolean: "color:#986801;", // Brown for booleans for quick identification
};

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function EventOptions({
  selectedEvent,
  open,
  setOpen,
}: {
  selectedEvent: any;
  open: boolean;
  setOpen: any;
}) {
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
        const response = await deleteEvent(selectedEvent.eventid); // Assuming id is used for events

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
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
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
                    onClick={() => setOpen(true)}
                  >
                    <UserIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    View Event Info
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex items-center px-4 py-2 text-sm"
                    )}
                    href={`/events/edit/${selectedEvent.eventid}`} // Assuming id is used for events
                  >
                    <FaRegEdit
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    Edit Event
                  </Link>
                )}
              </Menu.Item>
            </div>

            <div className="py-1">
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
                    Delete
                  </a>
                )}
              </Menu.Item>
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
                            View Event Info
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
                      <div className="relative mt-6 flex-1 flex-wrap overflow-hidden px-4 text-light sm:px-6">
                        <table className="w-full table-auto ">
                          <tbody>
                            <tr>
                              <td className="p-2 font-bold text-gray-400">Title:</td>
                              <td className="p-2">{selectedEvent.title}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-gray-400">
                                Description:
                              </td>
                              <td className="p-2">{selectedEvent.description}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-gray-400">Location:</td>
                              <td className="p-2">{selectedEvent.location}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-gray-400">
                                Event Date Time:
                              </td>
                              <td className="p-2">{selectedEvent.eventdatetime}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-gray-400">Capacity:</td>
                              <td className="p-2">{selectedEvent.capacity}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-gray-400">
                                Registration Fee:
                              </td>
                              <td className="p-2">{selectedEvent.registrationfee}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-gray-400">Created At:</td>
                              <td className="p-2">{selectedEvent.createdat}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-gray-400">Privacy:</td>
                              <td className="p-2">{selectedEvent.privacy}</td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="mt-5 flex gap-2">
                          {/* Links for Visit Page, Edit, and Delete */}
                        </div>
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
