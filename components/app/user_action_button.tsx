"use client";
import { deleteUser, sendPasswordRecovery } from "@/lib/userActions";
import { Dialog, Menu, Transition, Listbox } from "@headlessui/react";
import {
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  EnvelopeIcon,
} from "@heroicons/react/20/solid";
import { User } from "@supabase/supabase-js";
import { Fragment, useState } from "react";
import { usePopper } from "react-popper";
import Swal from "sweetalert2";
import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/client";

const supabase = createClient();

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function UserActionButton({
  selectedUser,
  userProfile,
  open,
  setOpen,
}: {
  selectedUser: User;
  userProfile: any;
  open: boolean;
  setOpen: any;
}) {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(selectedUser.role);

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

  const deleteBtn = async () => {
    const { user } = await getUser();

    if (selectedUser.id === user?.id) {
      Swal.fire({
        title: "Failed!",
        text: "You can't delete your own account.",
        icon: "error",
      });
    } else {
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
    }
  };

  const handleChangeRole = async () => {
    const { data, error } = await supabase.auth.admin.updateUserById(selectedUser.id, {
      role: selectedRole,
    });

    if (error) {
      Swal.fire({
        title: "Failed!",
        text: error.message,
        icon: "error",
      });
    } else {
      Swal.fire({
        title: "Success!",
        text: "User role updated successfully",
        icon: "success",
      });
      setChangeRoleOpen(false);
      location.reload(); // Refresh the page to reflect changes
    }
  };

  return (
    <>
      <Menu
        as="div"
        className="relative inline-block text-left"
        ref={setReferenceElement as unknown as React.RefObject<HTMLElement> | null}
      >
        <div>
          <Menu.Button className="inline-flex justify-center gap-x-1.5 rounded-md bg-charleston px-3 py-2 text-sm font-semibold text-light shadow-sm ring-1 ring-inset ring-[#525252] hover:bg-raisinblack">
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
                  <Link
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex cursor-pointer items-center px-4 py-2 text-sm"
                    )}
                    href="#"
                    onClick={() => setOpen(true)}
                  >
                    <UserIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    View User Info
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href={`/user/edit/${selectedUser.id}`}
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex cursor-pointer items-center px-4 py-2 text-sm"
                    )}
                  >
                    <PencilIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    Edit User Profile
                  </Link>
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
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={classNames(
                      active ? "bg-raisinblack text-light" : "text-light",
                      "group flex items-center px-4 py-2 text-sm"
                    )}
                    onClick={() => setChangeRoleOpen(true)}
                  >
                    <PencilIcon
                      className="mr-3 h-5 w-5 text-light group-hover:text-light"
                      aria-hidden="true"
                    />
                    Change Role
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
                            View User Info
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
                      <div className="relative flex-1 flex-wrap overflow-auto">
                        {/* <JSONPretty data={selectedUser} theme={jsonTheme}></JSONPretty> */}
                        <div className="relative mt-6 flex-1 flex-wrap overflow-hidden px-4 text-light sm:px-6">
                          <table className="w-full table-auto">
                            <tbody>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">Name:</td>
                                <td className="p-2">
                                  {userProfile.first_name} {userProfile.last_name}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">
                                  Description:
                                </td>
                                <td className="p-2">{userProfile.description}</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">Company:</td>
                                <td className="p-2">{userProfile?.company}</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">Website:</td>
                                <td className="p-2">{userProfile.website}</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">Email:</td>
                                <td className="p-2">{selectedUser.email}</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">Gender:</td>
                                <td className="p-2">
                                  {userProfile.gender == "M"
                                    ? "Male"
                                    : userProfile.gender == "F"
                                      ? "Female"
                                      : ""}
                                </td>
                              </tr>
                              <tr>
                                <td className="colspan-2" colSpan={2}>
                                  <hr className="my-5 w-full border-charleston text-charleston" />
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">Role:</td>
                                <td className="p-2">{selectedUser.role}</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">
                                  Created at:
                                </td>
                                <td className="p-2">
                                  {new Date(selectedUser.created_at).toLocaleString(
                                    "en-US",
                                    {
                                      weekday: "long", // "Monday"
                                      year: "numeric", // "2024"
                                      month: "long", // "April"
                                      day: "numeric", // "16"
                                      hour: "numeric", // "1"
                                      minute: "2-digit", // "40"
                                    }
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold text-gray-400">
                                  Last sign in:
                                </td>
                                <td className="p-2">
                                  {selectedUser.last_sign_in_at
                                    ? new Date(
                                        selectedUser.last_sign_in_at
                                      ).toLocaleString("en-US", {
                                        weekday: "long", // "Monday"
                                        year: "numeric", // "2024"
                                        month: "long", // "April"
                                        day: "numeric", // "16"
                                        hour: "numeric", // "1"
                                        minute: "2-digit", // "40"
                                      })
                                    : ""}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="mt-5 flex gap-2">
                            <Link
                              className="font-regular text-foreground relative inline-flex h-[26px] cursor-pointer items-center justify-center space-x-2 rounded-md border-[1px] border-zinc-600 bg-zinc-800 px-3 py-1 text-center text-xs hover:bg-opacity-60"
                              href={`/user/profile/${selectedUser.id}`}
                              target="_blank"
                            >
                              View Profile
                            </Link>
                            <Link
                              className="font-regular text-foreground relative inline-flex h-[26px] cursor-pointer items-center justify-center space-x-2 rounded-md border-[1px] border-zinc-600 bg-zinc-800 px-3 py-1 text-center text-xs hover:bg-opacity-60"
                              href={`/user/edit/${selectedUser.id}`}
                            >
                              Edit Profile
                            </Link>
                            <button
                              className="font-regular text-foreground relative inline-flex h-[26px] cursor-pointer items-center justify-center space-x-2 rounded-md border-[1px] border-zinc-600 bg-zinc-800 px-3 py-1 text-center text-xs hover:bg-opacity-60"
                              onClick={async () => {
                                const response = await sendPasswordRecovery(
                                  selectedUser.email!
                                );

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
                              Send password recovery
                            </button>
                            <button
                              className="font-regular text-foreground relative inline-flex h-[26px] cursor-pointer items-center justify-center space-x-2 rounded-md border-[1px] border-red-300 bg-red-500 px-3 py-1 text-center text-xs hover:bg-opacity-60"
                              onClick={deleteBtn}
                            >
                              Delete
                            </button>
                          </div>
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

      <Transition.Root show={changeRoleOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setChangeRoleOpen}>
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
                            Change User Role
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md text-gray-400 hover:text-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              onClick={() => setChangeRoleOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <Listbox value={selectedRole} onChange={setSelectedRole}>
                          {({ open }) => (
                            <>
                              <Listbox.Label className="block text-sm font-medium text-light">
                                Role
                              </Listbox.Label>
                              <div className="relative mt-1">
                                <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                                  <span className="block truncate">{selectedRole}</span>
                                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronDownIcon
                                      className="h-5 w-5 text-gray-400"
                                      aria-hidden="true"
                                    />
                                  </span>
                                </Listbox.Button>

                                <Transition
                                  show={open}
                                  as={Fragment}
                                  leave="transition ease-in duration-100"
                                  leaveFrom="opacity-100"
                                  leaveTo="opacity-0"
                                >
                                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {[
                                      "authenticated",
                                      "superadmin",
                                      "testing",
                                      "supabase_admin",
                                    ].map((role) => (
                                      <Listbox.Option
                                        key={role}
                                        className={({ active }) =>
                                          classNames(
                                            active
                                              ? "bg-indigo-600 text-white"
                                              : "text-gray-900",
                                            "relative cursor-default select-none py-2 pl-3 pr-9"
                                          )
                                        }
                                        value={role}
                                      >
                                        {({ selected, active }) => (
                                          <>
                                            <span
                                              className={classNames(
                                                selected
                                                  ? "font-semibold"
                                                  : "font-normal",
                                                "block truncate"
                                              )}
                                            >
                                              {role}
                                            </span>

                                            {selected ? (
                                              <span
                                                className={classNames(
                                                  active
                                                    ? "text-white"
                                                    : "text-indigo-600",
                                                  "absolute inset-y-0 right-0 flex items-center pr-4"
                                                )}
                                              >
                                                <CheckIcon
                                                  className="h-5 w-5"
                                                  aria-hidden="true"
                                                />
                                              </span>
                                            ) : null}
                                          </>
                                        )}
                                      </Listbox.Option>
                                    ))}
                                  </Listbox.Options>
                                </Transition>
                              </div>
                            </>
                          )}
                        </Listbox>
                        <div className="mt-5 sm:mt-6">
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                            onClick={handleChangeRole}
                          >
                            Save
                          </button>
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
