"use client";
import { check_permissions } from "@/lib/organization";
import { createClient } from "@/lib/supabase/client";
import { Menu, Popover } from "@headlessui/react";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EventsCard from "./events_card";

const sortOptions = [
  { name: "Title A-Z", value: "title-asc" },
  { name: "Title Z-A", value: "title-desc" },
  { name: "Date Newest First", value: "date-desc" },
  { name: "Date Oldest First", value: "date-asc" },
];

const eventStatusFilters = [
  { name: "All Events", value: "" },
  { name: "Open", value: "Open" },
  { name: "Ongoing", value: "Ongoing" },
  { name: "Closed", value: "Closed" },
];

const eventPrivacyFilters = [
  { name: "Default", value: "" },
  { name: "Public", value: "public" },
  { name: "Members Only", value: "private" },
];

interface OrganizationEventsComponentProps {
  events: any;
  userid: string;
  organizationId: string;
}

const OrganizationEventsComponent: React.FC<OrganizationEventsComponentProps> = ({
  events,
  userid,
  organizationId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null);
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("");
  const [eventPrivacyFilter, setEventPrivacyFilter] = useState("");
  const [sortOption, setSortOption] = useState("title-asc");
  const eventsPerPage = 8;
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        const { data: organization, error } = await supabase
          .from("organizations")
          .select("adminid, slug")
          .eq("organizationid", organizationId)
          .single();

        if (error) {
          throw error;
        }

        if (organization) {
          setOrganizationSlug(organization.slug);
          if (organization.adminid === userid) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch organization data", error);
      }
    };

    fetchOrganizationData();
  }, [organizationId, userid]);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const createPermission = await check_permissions(
          userid || "",
          organizationId,
          "create_events"
        );
        setCanCreateEvents(createPermission);
      } catch (error) {
        console.error("Failed to check permissions", error);
      }
    };

    checkPermissions();
  }, [userid, organizationId]);

  // Filter and sort events based on search query and filters
  const filteredEvents = events
    .filter((event: any) => {
      const matchesSearchQuery = event.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        eventStatusFilter === "" || event.status === eventStatusFilter;

      const eventPrivacy = event.privacy || {};
      const isPublic = eventPrivacy.type === "public";
      const isPrivate = eventPrivacy.type === "private";

      let matchesPrivacy = false;

      if (eventPrivacyFilter === "") {
        matchesPrivacy = true;
      } else if (eventPrivacyFilter === "public") {
        matchesPrivacy = isPublic;
      } else if (eventPrivacyFilter === "private") {
        matchesPrivacy = isPrivate;
      }

      return matchesSearchQuery && matchesStatus && matchesPrivacy;
    })
    .sort((a: any, b: any) => {
      switch (sortOption) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "date-asc":
          return (
            new Date(a.starteventdatetime).getTime() -
            new Date(b.starteventdatetime).getTime()
          );
        case "date-desc":
          return (
            new Date(b.starteventdatetime).getTime() -
            new Date(a.starteventdatetime).getTime()
          );
        default:
          return 0;
      }
    });

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const isFirstPage = currentPage === 1;
  const isLastPage = indexOfLastEvent >= filteredEvents.length;

  // Add these helper functions at the component level
  const getSelectedSortLabel = (value: string) => {
    return sortOptions.find(option => option.value === value)?.name || 'Sort by';
  };

  const getSelectedStatusLabel = (value: string) => {
    return eventStatusFilters.find(filter => filter.value === value)?.name || 'Status';
  };

  const getSelectedPrivacyLabel = (value: string) => {
    return eventPrivacyFilters.find(filter => filter.value === value)?.name || 'Privacy';
  };

  return (
    <div className="mx-auto max-w-7xl lg:px-8">
      {/* Title */}
      <div className="mx-auto max-w-7xl text-center">
        <p className="mt-2 text-2xl font-bold tracking-tight text-light">
          Our Events
        </p>
      </div>

      {/* Search, Sort, Filter, and Create Event Button */}
      <div className="mx-auto mt-4 flex flex-col space-y-2 sm:space-y-4 max-w-3xl">
        {/* Search Bar */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-charleston bg-charleston p-2 pl-10 pr-4 text-sm text-light focus:border-primary focus:ring-primary"
          />
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </div>
        </div>

        {/* Filters and Create Button Container */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {/* Sort and Filters Group */}
          <div className="flex flex-wrap gap-2">
            {/* Sort Menu */}
            <Menu as="div" className="relative">
              {({ close }) => (
                <>
                  <Menu.Button className="flex items-center rounded-md bg-charleston px-3 py-1.5 text-sm font-medium text-light">
                    {getSelectedSortLabel(sortOption)}
                    <ChevronDownIcon className="ml-1 h-5 w-5" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-44 rounded-md bg-charleston shadow-lg">
                    {sortOptions.map((option) => (
                      <Menu.Item key={option.value}>
                        {({ active }) => (
                          <div
                            onClick={() => {
                              setSortOption(option.value);
                              close(); // Close menu after selection
                            }}
                            className={`cursor-pointer px-4 py-2 text-sm ${
                              sortOption === option.value
                                ? "bg-primary text-white"
                                : active
                                ? "bg-[#383838] text-light"
                                : "text-light"
                            }`}
                          >
                            {option.name}
                          </div>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </>
              )}
            </Menu>

            {/* Status Filter */}
            <Popover className="relative">
              {({ close }) => (
                <>
                  <Popover.Button className="flex items-center rounded-md bg-charleston px-3 py-1.5 text-sm font-medium text-light">
                    {getSelectedStatusLabel(eventStatusFilter)}
                    <ChevronDownIcon className="ml-1 h-5 w-5" />
                  </Popover.Button>
                  <Popover.Panel className="absolute right-0 z-50 mt-2 w-36 rounded-md bg-charleston shadow-lg">
                    {eventStatusFilters.map((filter) => (
                      <div
                        key={filter.value}
                        onClick={() => {
                          setEventStatusFilter(filter.value);
                          close(); // Close popover after selection
                        }}
                        className={`cursor-pointer px-4 py-2 text-sm ${
                          eventStatusFilter === filter.value
                            ? "bg-primary text-white"
                            : "text-light hover:bg-[#383838]"
                        }`}
                      >
                        {filter.name}
                      </div>
                    ))}
                  </Popover.Panel>
                </>
              )}
            </Popover>

            {/* Privacy Filter */}
            <Popover className="relative">
              {({ close }) => (
                <>
                  <Popover.Button className="flex items-center rounded-md bg-charleston px-3 py-1.5 text-sm font-medium text-light">
                    {getSelectedPrivacyLabel(eventPrivacyFilter)}
                    <ChevronDownIcon className="ml-1 h-5 w-5" />
                  </Popover.Button>
                  <Popover.Panel className="absolute right-0 z-50 mt-2 w-36 rounded-md bg-charleston shadow-lg">
                    {eventPrivacyFilters.map((filter) => (
                      <div
                        key={filter.value}
                        onClick={() => {
                          setEventPrivacyFilter(filter.value);
                          close(); // Close popover after selection
                        }}
                        className={`cursor-pointer px-4 py-2 text-sm ${
                          eventPrivacyFilter === filter.value
                            ? "bg-primary text-white"
                            : "text-light hover:bg-[#383838]"
                        }`}
                      >
                        {filter.name}
                      </div>
                    ))}
                  </Popover.Panel>
                </>
              )}
            </Popover>
          </div>

          {/* Create Event Button */}
          {canCreateEvents && (
            <Link
              href={`/events/create/${organizationSlug}`}
              className="mt-2 sm:mt-0 inline-flex justify-center rounded-lg bg-primary px-4 py-1.5 text-white hover:bg-primary-dark"
            >
              Create Event
            </Link>
          )}
        </div>
      </div>

      {/* Event Cards */}
      <div className="isolate mx-auto mt-8 grid max-w-lg grid-cols-1 justify-items-center gap-4 sm:mt-8 md:mx-auto md:max-w-lg md:grid-cols-2 md:gap-6 lg:mx-0 lg:max-w-none lg:grid-cols-4">
        {currentEvents.map((event: any, index: number) => (
          <EventsCard
            key={index}
            event={{
              id: event.eventid,
              eventid: event.eventid,
              eventphoto: event.eventphoto,
              capacity: event.capacity,
              organizationid: event.organizationid,
              imageUrl: event.eventphoto,
              title: event.title,
              description: event.description,
              registrationfee: event.registrationfee,
              starteventdatetime: event.starteventdatetime,
              endeventdatetime: event.endeventdatetime,
              location: event.location,
              eventslug: event.eventslug,
              tags: event.tags,
              privacy: event.privacy,
              createdat: event.createdat,
              status: event.status, // Ensure status is passed
            }}
          />
        ))}
      </div>

      {currentEvents.length <= 0 && (
        <div
          className="mb-4 rounded-lg bg-gray-800 p-4 text-center text-sm text-blue-400"
          role="alert"
        >
          The organization has no events available for you.
        </div>
      )}

      {/* Pagination */}
      {filteredEvents.length > eventsPerPage && (
        <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
          <div className="-mt-px flex w-0 flex-1">
            <button
              disabled={isFirstPage}
              onClick={() => paginate(currentPage - 1)}
              className={`inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium ${
                isFirstPage
                  ? "cursor-not-allowed text-gray-500"
                  : "text-light hover:border-primary hover:text-primary"
              }`}
            >
              <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-light" aria-hidden="true" />
              Previous
            </button>
          </div>
          <div className="hidden md:-mt-px md:flex">
            {Array.from(
              { length: Math.ceil(filteredEvents.length / eventsPerPage) },
              (_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium ${
                    currentPage === index + 1
                      ? "border-primary-dark text-primary"
                      : "text-light hover:border-primary hover:text-primary"
                  }`}
                >
                  {index + 1}
                </button>
              )
            )}
          </div>
          <div className="-mt-px flex w-0 flex-1 justify-end">
            <button
              disabled={isLastPage}
              onClick={() => paginate(currentPage + 1)}
              className={`inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium ${
                isLastPage
                  ? "cursor-not-allowed text-gray-500"
                  : "text-light hover:border-primary hover:text-primary"
              }`}
            >
              Next
              <ArrowLongRightIcon className="ml-3 h-5 w-5 text-light" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default OrganizationEventsComponent;
