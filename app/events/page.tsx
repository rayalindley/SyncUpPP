"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import EventsCard from "@/components/organization/events_card";
import { createClient, getUser } from "@/lib/supabase/client";
import { User } from "@supabase/auth-js/src/lib/types";
import { Event } from "@/types/event";
import { Menu, Popover } from "@headlessui/react";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

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

export default function EventsPublicView() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [eventStatusFilter, setEventStatusFilter] = useState(""); // Event status filter state
  const [eventPrivacyFilter, setEventPrivacyFilter] = useState(""); // Privacy filter state
  const [sortOption, setSortOption] = useState("title-asc"); // Sort option state
  const [eventsPerPage, setEventsPerPage] = useState(8); // Default for desktop

  // Detect screen size and set eventsPerPage
  useEffect(() => {
    const updateEventsPerPage = () => {
      setEventsPerPage(window.innerWidth <= 640 ? 6 : 8); // Mobile devices: 6, Desktop: 8
    };

    updateEventsPerPage(); // Set on initial load
    window.addEventListener("resize", updateEventsPerPage);

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", updateEventsPerPage);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const { user } = await getUser();
      setUser(user);
    }

    async function fetchEvents() {
      const supabase = createClient();
      const { data: events, error } = await supabase.from("events").select("*");

      if (!error) {
        setEvents(events);
      } else {
        console.error("Error fetching events:", error);
      }
    }

    fetchUser();
    fetchEvents();
  }, []);

  // Filter and sort events based on search query and filters
  const filteredEvents = events
    .filter((event: any) => {
      const matchesSearchQuery = event.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        eventStatusFilter === "" || event.status === eventStatusFilter;

      // Adjusted privacy logic based on the new structure of the privacy object
      const eventPrivacy = event.privacy || {};
      const isPublic = eventPrivacy.type === "public";
      const isPrivate = eventPrivacy.type === "private";

      let matchesPrivacy = false;

      if (eventPrivacyFilter === "") {
        // No privacy filter applied, so show all events
        matchesPrivacy = true;
      } else if (eventPrivacyFilter === "public") {
        // Match public events
        matchesPrivacy = isPublic;
      } else if (eventPrivacyFilter === "private") {
        // Match private events (check if it's private and if roles or memberships match)
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="isolate flex-grow px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mt-8 sm:mt-16">
            <h1 className="text-center text-3xl font-bold text-light">Events</h1>
            <div className="mt-2 px-4 text-center text-sm text-light sm:px-8 lg:px-10">
              <p>Browse and view events that fit your interests.</p>
            </div>

            <div className="mx-auto mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-6">
  {/* Search Bar */}
  <div className="relative w-full sm:w-1/3">
    <input
      type="text"
      placeholder="Search events..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full rounded-lg border border-charleston bg-charleston p-2 pl-10 pr-4 text-sm text-light focus:border-primary focus:ring-primary"
    />
    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
      <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
    </div>
  </div>

  {/* Filters */}
  <div className="flex w-full justify-center gap-4 sm:w-auto">
    {/* Sort Dropdown */}
    <select
      value={sortOption}
      onChange={(e) => setSortOption(e.target.value)}
      className="w-full sm:w-auto rounded-lg border border-charleston bg-charleston p-2 text-sm text-light focus:border-primary focus:ring-primary"
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>

    {/* Status Dropdown */}
    <select
      value={eventStatusFilter}
      onChange={(e) => setEventStatusFilter(e.target.value)}
      className="w-full sm:w-auto rounded-lg border border-charleston bg-charleston p-2 text-sm text-light focus:border-primary focus:ring-primary"
    >
      {eventStatusFilters.map((filter) => (
        <option key={filter.value} value={filter.value}>
          {filter.name}
        </option>
      ))}
    </select>

    {/* Privacy Dropdown */}
    <select
      value={eventPrivacyFilter}
      onChange={(e) => setEventPrivacyFilter(e.target.value)}
      className="w-full sm:w-auto rounded-lg border border-charleston bg-charleston p-2 text-sm text-light focus:border-primary focus:ring-primary"
    >
      {eventPrivacyFilters.map((filter) => (
        <option key={filter.value} value={filter.value}>
          {filter.name}
        </option>
      ))}
    </select>
  </div>
</div>

            {/* Event Cards */}
            <div className="mx-auto mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentEvents.map((event) => (
                <EventsCard
                  key={event.eventid}
                  event={{
                    id: event.eventid,
                    eventid: event.eventid,
                    imageUrl: event.eventphoto,
                    title: event.title,
                    description: event.description,
                    registrationfee: event.registrationfee,
                    starteventdatetime: event.starteventdatetime,
                    endeventdatetime: event.endeventdatetime,
                    location: event.location,
                    eventslug: event.eventslug,
                    eventphoto: event.eventphoto,
                    capacity: event.capacity,
                    organizationid: event.organizationid,
                    tags: event.tags,
                    createdat: event.createdat,
                    privacy: event.privacy,
                    status: event.status, // Ensure status is passed
                  }}
                />
              ))}
            </div>
          </div>

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
                  <ArrowLongLeftIcon
                    className="mr-3 h-5 w-5 text-light"
                    aria-hidden="true"
                  />
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
                  <ArrowLongRightIcon
                    className="ml-3 h-5 w-5 text-light"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
