"use client";
import { Organizations as Organization } from "@/lib/types"; // Ensure the correct import
import useSidebarStore from "@/store/use_sidebar_store";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import {
  Cog6ToothIcon,
  EnvelopeIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

import { IoIosAnalytics } from "react-icons/io";
import {
  IoCalendarOutline,
  IoMailUnreadOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { TbUserStar } from "react-icons/tb";

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const getInitials = (name: string) => {
  const words = name.split(" ");
  if (words.length > 1) {
    return words[0][0] + words[1][0];
  } else {
    return name.substring(0, 2);
  }
};

const SideNavMenuForUsers = ({ organizations }: { organizations: Organization[] }) => {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useSidebarStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    toggleSidebar: state.toggleSidebar,
    setSidebarOpen: state.setSidebarOpen,
  }));
  const router = useRouter();

  const { slug } = useParams() as { slug: string };

  const pathname = usePathname();
  const [currentItem, setCurrentItem] = useState(pathname);
  const [selected, setSelected] = useState<Organization | "default" | "create-org">(
    "default"
  );

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  const navigation = [
    {
      name: "Overview",
      href:
        selected === "default" || typeof selected === "string"
          ? `/dashboard`
          : `/${selected.slug}/dashboard`,
      icon: IoIosAnalytics,
    },
    {
      name: "Roles",
      href:
        selected === "default" || typeof selected === "string"
          ? `/dashboard/roles`
          : `/${selected.slug}/dashboard/roles`,
      icon: IoShieldCheckmarkOutline,
    },
    {
      name: "Memberships",
      href:
        selected === "default" || typeof selected === "string"
          ? `/dashboard/memberships`
          : `/${selected.slug}/dashboard/memberships`,
      icon: TbUserStar,
    },
    {
      name: "Newsletter",
      href:
        selected === "default" || typeof selected === "string"
          ? `/dashboard/newsletter`
          : `/${selected.slug}/dashboard/newsletter`,
      icon: EnvelopeIcon,
    },
    {
      name: "Events",
      href:
        selected === "default" || typeof selected === "string"
          ? `/dashboard/events`
          : `/${selected.slug}/dashboard/events`,
      icon: IoCalendarOutline,
    },
  ];

  useEffect(() => {
    if (slug) {
      const organization = organizations.find((org) => org.slug === slug);
      if (organization) {
        setSelected(organization);
      }
    } else {
      setSelected("default");
    }
  }, [organizations, slug]);

  useEffect(() => {
    setCurrentItem(pathname);
  }, [pathname]);

  useEffect(() => {
    if (selected === "default" && slug) {
      router.push("/dashboard");
    } else if (
      selected !== "default" &&
      selected !== "create-org" &&
      typeof selected !== "string"
    ) {
      const newSlugPath = pathname?.startsWith(`/${selected.slug}`)
        ? pathname
        : `/${selected.slug}/dashboard`;
      router.push(newSlugPath ?? "/");
    }
  }, [selected, slug, pathname, router]);

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-eerieblack px-6 pb-4">
                  <Link href="/">
                    <div className="flex h-16 shrink-0 items-center">
                      <img className="h-10 w-auto" src="/syncup.png" alt="SyncUp" />
                      <p className="ml-2 font-semibold text-light">SyncUp</p>
                    </div>
                  </Link>

                  <Listbox value={selected} onChange={setSelected}>
                    {({ open }) => (
                      <>
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                            <span className="flex items-center">
                              {selected === "default" ? (
                                <span className="ml-3 block truncate">Default</span>
                              ) : typeof selected !== "string" && selected?.photo ? (
                                <img
                                  src={`${supabaseStorageBaseUrl}/${selected.photo}`}
                                  alt=""
                                  className="h-5 w-5 flex-shrink-0 rounded-full"
                                />
                              ) : (
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700">
                                  <span className="text-xs uppercase text-white">
                                    {typeof selected !== "string"
                                      ? getInitials(selected.name)
                                      : ""}
                                  </span>
                                </div>
                              )}
                              <span className="ml-3 block truncate">
                                {typeof selected !== "string" ? selected.name : ""}
                              </span>
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                              <ChevronUpDownIcon
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
                            <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              <Listbox.Option
                                key="create-org"
                                className={({ active }) =>
                                  classNames(
                                    active ? "bg-primary text-white" : "text-gray-900",
                                    "relative cursor-default select-none py-2 pl-3 pr-9"
                                  )
                                }
                                value="create-org"
                              >
                                {({ active }) => (
                                  <Link
                                    href="/organization/create"
                                    className="flex items-center"
                                  >
                                    <span
                                      className={classNames(
                                        active ? "font-semibold" : "font-normal",
                                        "ml-3 block truncate"
                                      )}
                                    >
                                      Create Org
                                    </span>
                                  </Link>
                                )}
                              </Listbox.Option>
                              <Listbox.Option
                                key="default"
                                className={({ active }) =>
                                  classNames(
                                    active ? "bg-primary text-white" : "text-gray-900",
                                    "relative cursor-default select-none py-2 pl-3 pr-9"
                                  )
                                }
                                value="default"
                              >
                                {({ active }) => (
                                  <Link href="/dashboard" className="flex items-center">
                                    <span
                                      className={classNames(
                                        active ? "font-semibold" : "font-normal",
                                        "ml-3 block truncate"
                                      )}
                                    >
                                      Default
                                    </span>
                                  </Link>
                                )}
                              </Listbox.Option>
                              {organizations?.map((organization) => (
                                <Listbox.Option
                                  key={organization.id}
                                  className={({ active }) =>
                                    classNames(
                                      active ? "bg-primary text-white" : "text-gray-900",
                                      "relative cursor-default select-none py-2 pl-3 pr-9"
                                    )
                                  }
                                  value={organization}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <div className="flex items-center">
                                        {organization.photo ? (
                                          <img
                                            src={`${supabaseStorageBaseUrl}/${organization.photo}`}
                                            alt=""
                                            className="h-5 w-5 flex-shrink-0 rounded-full"
                                          />
                                        ) : (
                                          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700">
                                            <span className="text-xs uppercase text-white">
                                              {getInitials(organization.name)}
                                            </span>
                                          </div>
                                        )}
                                        <span
                                          className={classNames(
                                            selected ? "font-semibold" : "font-normal",
                                            "ml-3 block truncate"
                                          )}
                                        >
                                          {organization.name}
                                        </span>
                                      </div>

                                      {selected ? (
                                        <span
                                          className={classNames(
                                            active ? "text-white" : "text-indigo-600",
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

                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={classNames(
                                  currentItem === item.href
                                    ? "bg-charleston text-light"
                                    : "text-light hover:bg-charleston hover:text-light",
                                  "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    currentItem === item.href
                                      ? "text-light"
                                      : "text-gray-400 group-hover:text-light",
                                    "h-6 w-6 shrink-0"
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                      {slug && (
                        <li className="">
                          <hr className="my-4 border-t border-fadedgrey" />
                          <Link href={`/${slug}`}>
                            <div className="border-1 rounded-md border border-primary bg-primarydark p-1 px-2 text-center text-sm text-gray-100 hover:cursor-pointer">
                              Visit Page
                            </div>
                          </Link>
                        </li>
                      )}
                      <li className="mt-auto">
                        <Link
                          href="#"
                          className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                        >
                          <Cog6ToothIcon
                            className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                            aria-hidden="true"
                          />
                          Settings
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-fadedgrey bg-eerieblack px-6">
          <Link href="/">
            <div className="flex h-16 shrink-0 items-center">
              <img className="h-10 w-auto" src="/syncup.png" alt="SyncUp" />
              <p className="ml-2 font-semibold text-light">SyncUp</p>
            </div>
          </Link>

          <Listbox value={selected} onChange={setSelected}>
            {({ open }) => (
              <>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-charleston py-1.5 pl-3 pr-10 text-left text-light shadow-sm ring-1 ring-inset ring-fadedgrey focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm sm:leading-6">
                    <span className="flex items-center">
                      {selected === "default" ? (
                        <span className="ml-3 block truncate">Default</span>
                      ) : typeof selected !== "string" && selected?.photo ? (
                        <img
                          src={`${supabaseStorageBaseUrl}/${selected.photo}`}
                          alt=""
                          className="h-5 w-5 flex-shrink-0 rounded-full"
                        />
                      ) : (
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700">
                          <span className="shrink text-xs uppercase text-white">
                            {typeof selected !== "string"
                              ? getInitials(selected.name)
                              : ""}
                          </span>
                        </div>
                      )}
                      <span className="ml-3 block truncate">
                        {typeof selected !== "string" ? selected.name : ""}
                      </span>
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                      <ChevronUpDownIcon
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
                    <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-charleston py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      <Listbox.Option
                        key="create-org"
                        className={({ active }) =>
                          classNames(
                            active ? "bg-primary text-white" : "text-light",
                            "relative cursor-default select-none py-2 pl-3 pr-9"
                          )
                        }
                        value="create-org"
                      >
                        {({ active }) => (
                          <Link href="/organization/create" className="flex items-center">
                            <span
                              className={classNames(
                                active ? "font-semibold" : "font-normal",
                                "ml-3 block truncate"
                              )}
                            >
                              Create Org
                            </span>
                          </Link>
                        )}
                      </Listbox.Option>
                      <Listbox.Option
                        key="default"
                        className={({ active }) =>
                          classNames(
                            active ? "bg-primary text-white" : "text-light",
                            "relative cursor-default select-none py-2 pl-3 pr-9"
                          )
                        }
                        value="default"
                      >
                        {({ active }) => (
                          <Link href="/dashboard" className="flex items-center">
                            <span
                              className={classNames(
                                active ? "font-semibold" : "font-normal",
                                "ml-3 block truncate"
                              )}
                            >
                              Default
                            </span>
                          </Link>
                        )}
                      </Listbox.Option>
                      {organizations.map((organization) => (
                        <Listbox.Option
                          key={organization.id}
                          className={({ active }) =>
                            classNames(
                              active ? "bg-primary text-white" : "text-light",
                              "relative cursor-default select-none py-2 pl-3 pr-9"
                            )
                          }
                          value={organization}
                        >
                          {({ selected, active }) => (
                            <>
                              <div className="flex items-center">
                                {organization.photo ? (
                                  <img
                                    src={`${supabaseStorageBaseUrl}/${organization.photo}`}
                                    alt=""
                                    className="h-5 w-5 flex-shrink-0 rounded-full"
                                  />
                                ) : (
                                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700">
                                    <span className="text-xs uppercase text-white">
                                      {getInitials(organization.name)}
                                    </span>
                                  </div>
                                )}
                                <span
                                  className={classNames(
                                    selected ? "font-semibold" : "font-normal",
                                    "ml-3 block truncate"
                                  )}
                                >
                                  {organization.name}
                                </span>
                              </div>

                              {selected ? (
                                <span
                                  className={classNames(
                                    active ? "text-white" : "text-light",
                                    "absolute inset-y-0 right-0 flex items-center pr-4"
                                  )}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
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

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={classNames(
                          currentItem === item.href
                            ? "bg-charleston text-light"
                            : "text-light hover:bg-charleston hover:text-light",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                        )}
                      >
                        <item.icon
                          className={classNames(
                            currentItem === item.href
                              ? "text-light"
                              : "text-gray-400 group-hover:text-light",
                            "h-6 w-6 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              {slug && (
                <li className="">
                  <hr className="mb-5 border-t border-fadedgrey" />
                  <Link href={`/${slug}`}>
                    <div className="border-1 rounded-md border border-primary bg-primarydark p-1 px-2 text-center text-sm text-gray-100 hover:cursor-pointer">
                      Visit Page
                    </div>
                  </Link>
                </li>
              )}
              <li className="mt-auto">
                <Link
                  href="#"
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                >
                  <Cog6ToothIcon
                    className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                    aria-hidden="true"
                  />
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default SideNavMenuForUsers;
