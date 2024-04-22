"use client";
import { deleteUser, sendPasswordRecovery } from "@/lib/userActions";
import { Dialog, Menu, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { EnvelopeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import { Fragment, useState } from "react";
import { usePopper } from "react-popper";
import Swal from "sweetalert2";
import UserInfo from "./UserInfo";

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

export default function UserActionButton({ selectedUser }: { selectedUser: User }) {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "flip",
        options: {
          fallbackPlacements: ["top-end"],
        },
      },
    ],
  });
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
        const response = await deleteUser(selectedUser.id);

        if (!response.error) {
          Swal.fire({
            title: "Deleted!",
            text: "The user successfully deleted.",
            icon: "success",
          }).then(() => {
            location.reload(); // Reload the page
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

  const [open, setOpen] = useState(false);
  return (
    <>
      <Menu
        as="div"
        className="relative inline-block text-left"
        ref={setReferenceElement as unknown as React.RefObject<HTMLElement> | null}
      >
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
          <Menu.Items
            className="absolute right-0 z-50 mt-2 w-56 origin-top-left divide-y divide-[#525252] rounded-md bg-charleston shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            ref={setPopperElement as React.Ref<HTMLDivElement> | null}
            style={styles.popper}
          >
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <a
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex cursor-pointer items-center px-4 py-2 text-sm"
                    )}
                    onClick={() => setOpen(true)}
                  >
                    <UserIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    View User Info
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <a
                    href={`/dashboard/edit-user-profile/${selectedUser.id}`}
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex cursor-pointer items-center px-4 py-2 text-sm"
                    )}
                  >
                    <PencilIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    Edit User Info
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex items-center px-4 py-2 text-sm"
                    )}
                    onClick={async () => {
                      const response = await sendPasswordRecovery(selectedUser.email!);

                      if (!response.error) {
                        Swal.fire({
                          title: "Email Sent!",
                          text: "The password recovery was sent to the user's email",
                          icon: "success",
                          customClass: {
                            container: "bg-[red] text-light",
                            confirmButton: "bg-primary hover:bg-primarydark",
                          },
                        });
                      } else {
                        Swal.fire({
                          title: "Failed!",
                          text: response.error.message,
                          icon: "error",
                          customClass: {
                            container: "bg-raisinblack text-light",
                            confirmButton: "bg-primary hover:bg-primarydark",
                          },
                        });
                      }
                    }}
                  >
                    <EnvelopeIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                      onClick={async () => {
                        const response = await sendPasswordRecovery(selectedUser.id!);

                        if (!response.error) {
                          Swal.fire({
                            title: "Email Sent!",
                            text: "The password recovery was sent to the user's email",
                            icon: "success",
                            customClass: {
                              container: "bg-raisinblack text-light",
                              confirmButton: "bg-primary hover:bg-primarydark",
                            },
                          });
                        } else {
                          Swal.fire({
                            title: "Failed!",
                            text: response.error.message,
                            icon: "error",
                            customClass: {
                              container: "bg-raisinblack text-light",
                              confirmButton: "bg-primary hover:bg-primarydark",
                            },
                          });
                        }
                      }}
                    />
                    Send password recovery
                  </button>
                )}
              </Menu.Item>
            </div>

            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <a
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex cursor-pointer items-center px-4 py-2 text-sm"
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

          <div className="fixed inset-0 overflow-hidden">
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
                            View user info
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
                      <div className="relative mt-6 flex-1 flex-wrap overflow-hidden px-4 sm:px-6">
                        <UserInfo userId={selectedUser.id} />
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
