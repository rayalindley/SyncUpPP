import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import EventsCard from "./events_card";
const OrganizationEventsComponent = () => {
  const events = [
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.V76hCjYZKa70VvykQdMeugAAAA?rs=1&pid=ImgDetMain",
      title: "Event 1",
      description: "Description for Event 1",
      attendees: 50,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },
    {
      imageUrl:
        "https://th.bing.com/th/id/OIP.VqxtlWgrsfErpOTyES3jxQHaEa?rs=1&pid=ImgDetMain",
      title: "Event 2",
      description: "Description for Event 2",
      attendees: 30,
    },

    // Add more events as needed
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const isFirstPage = currentPage === 1;
  const isLastPage = indexOfLastEvent >= events.length;

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <p className="mt-2 text-2xl font-bold tracking-tight text-light sm:text-2xl">
          Our Events
        </p>
      </div>
      <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-x-8 gap-y-8 sm:mt-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {currentEvents.map((event, index) => (
          <EventsCard key={index} event={event} />
        ))}
      </div>
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
    </div>
  );
};

export default OrganizationEventsComponent;
