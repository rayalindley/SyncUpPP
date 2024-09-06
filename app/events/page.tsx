"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import EventsCard from "@/components/organization/events_card";
import { createClient, getUser } from "@/lib/supabase/client";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { Event } from "@/types/event";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

export default function EventsPublicView() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [eventStatusFilter, setEventStatusFilter] = useState(""); // Event status filter state
  const [eventPrivacyFilter, setEventPrivacyFilter] = useState(""); // Privacy filter state
  const eventsPerPage = 8;

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

  const now = new Date();

  // Filter events based on search query and filters
  const filteredEvents = events.filter((event) => {
    const matchesSearchQuery = event.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const isUpcoming =
      eventStatusFilter === "Upcoming" && new Date(event.starteventdatetime) > now;
    const isOngoing =
      eventStatusFilter === "Ongoing" &&
      new Date(event.starteventdatetime) <= now &&
      new Date(event.endeventdatetime) > now;
    const isCompleted =
      eventStatusFilter === "Completed" && new Date(event.endeventdatetime) < now;

    const matchesStatus =
      eventStatusFilter === "" || isUpcoming || isOngoing || isCompleted;

    const matchesPrivacy =
      eventPrivacyFilter === "" || event.privacy === eventPrivacyFilter;

    return matchesSearchQuery && matchesStatus && matchesPrivacy;
  });

  // Pagination
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const isFirstPage = currentPage === 1;
  const isLastPage = indexOfLastEvent >= filteredEvents.length;

  return (
    <div>
      <Header user={user} />
      <main className="isolate flex flex-col items-center sm:px-4 md:px-6 lg:px-80">
        <div className="relative w-full">
          <div className="mt-4 sm:mt-16 lg:mt-24">
            <h1 className="text-center text-3xl font-bold text-light">Events</h1>
            <div className="mt-2 px-4 text-center text-sm text-light sm:px-8 lg:px-10">
              <p>Browse and view events that fit your interests.</p>
            </div>

            {/* Search Bar and Filters */}
            <div className="mx-auto mt-6 flex w-full justify-center space-x-4 px-2">
              <div className="relative w-full flex-grow">
                <input
                  type="text"
                  placeholder="Search events"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-charleston bg-charleston p-2 pl-4 pr-10 text-sm text-light focus:border-primary focus:ring-primary"
                />
                {/* Magnifying Glass Icon */}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Event Status Filter */}
              <select
                value={eventStatusFilter}
                onChange={(e) => setEventStatusFilter(e.target.value)}
                className="w-32 rounded-lg border border-charleston bg-charleston p-2 pl-4 pr-8 text-sm text-light focus:border-primary focus:ring-primary"
              >
                <option value="">All Events</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Event Privacy Filter */}
              <select
                value={eventPrivacyFilter}
                onChange={(e) => setEventPrivacyFilter(e.target.value)}
                className="w-32 rounded-lg border border-charleston bg-charleston p-2 pl-4 pr-8 text-sm text-light focus:border-primary focus:ring-primary"
              >
                <option value="">Default</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Event Cards */}
            <div className="min-w-2xl mx-auto mt-20 grid justify-items-center gap-x-1 gap-y-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <nav className="mt-8 flex w-full items-center justify-between border-t border-gray-200 px-4 sm:px-0">
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
                      ? "border-primarydark text-primary"
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
      </main>
      <Footer />
    </div>
  );
}
