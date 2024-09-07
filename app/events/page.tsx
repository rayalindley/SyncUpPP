"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import EventsCard from "@/components/organization/events_card";
import { createClient, getUser } from "@/lib/supabase/client";
import { Event } from "@/types/event";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

export default function EventsPublicView() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;

  useEffect(() => {
    async function fetchUser() {
      const { user } = await getUser(); // Adjust this to your actual user fetching logic
      // console.log(user);
      setUser(user);
    }

    async function fetchEvents() {
      const supabase = createClient();
      const { data: events, error } = await supabase.from("events").select("*");

      // console.log(events, error);

      if (!error) {
        setEvents(events);
      } else {
        console.error("Error fetching events:", error);
      }
    }

    fetchUser();
    fetchEvents();
  }, []);

  // Calculate the current events to display
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

  // Pagination handlers
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const isFirstPage = currentPage === 1;
  const isLastPage = indexOfLastEvent >= events.length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="isolate flex-grow px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-24">
        <div className="mx-auto max-w-7xl">
          <div className="mt-8 sm:mt-16">
            <h1 className="text-center text-3xl font-bold text-light">Events</h1>
            <div className="mt-2 text-center text-sm text-light">
              <p>Browse and view events that fit your interests.</p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <nav className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
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
              { length: Math.ceil(events.length / eventsPerPage) },
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
