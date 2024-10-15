import EventsCard from "@/components/organization/events_card";
import { Event } from "@/types/event";
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

interface UserEventsProps {
  events: Event[];
}

const UserEvents: React.FC<UserEventsProps> = ({ events }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4; // Set the number of events per page to 3

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const isFirstPage = currentPage === 1;
  const isLastPage = indexOfLastEvent >= events.length;

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <p className="mt-2 text-2xl font-bold tracking-tight text-light sm:text-2xl">
          My Events
        </p>
      </div>
      <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-x-4 gap-y-8 sm:mt-12 lg:mx-0 lg:max-w-none lg:grid-cols-4">
        {currentEvents.map((event, index) => (
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
            }}
          />
        ))}
      </div>

      {/* Show pagination only if the number of events exceeds eventsPerPage */}
      {events.length > eventsPerPage && (
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
              <ArrowLongRightIcon className="ml-3 h-5 w-5 text-light" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default UserEvents;
