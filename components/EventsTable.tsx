import React, { useState, useEffect } from "react";
import { Event } from "@/lib/types";

const EventsTable = ({
  events,
  setEvents,
  toggleSelection,
}: {
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  toggleSelection: (list: Event[], id: string) => Event[];
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof Event | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEvents, setFilteredEvents] = useState(events);

  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  useEffect(() => {
    if (!sortColumn && !sortDirection) {
      setEvents((prevEvents) =>
        [...prevEvents].sort((a, b) => a.title.localeCompare(b.title))
      );
    }
  }, [sortColumn, sortDirection, setEvents]);

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = events.filter((event) =>
      [
        "title",
        "description",
        "location",
        "registrationfee",
        "capacity",
        "privacy",
        "tags",
        "eventslug",
      ].some(
        (field) =>
          event[field as keyof Event] !== undefined &&
          event[field as keyof Event]?.toString().toLowerCase().includes(search)
      )
    );

    const startIndex = (currentPage - 1) * eventsPerPage;
    const paginatedEvents = filtered.slice(startIndex, startIndex + eventsPerPage);
    setFilteredEvents(paginatedEvents);
  }, [events, searchTerm, currentPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked);
    setEvents(events.map((event) => ({ ...event, selected: e.target.checked })));
  };

  const handleSelectRow = (id: string) => {
    setEvents(toggleSelection(events, id));
  };

  const handleSort = (column: keyof Event) => {
    const direction =
      sortColumn !== column ? "asc" : sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(direction);
    setFilteredEvents(
      [...filteredEvents].sort((a, b) => {
        if (a[column] === undefined) return 1;
        if (b[column] === undefined) return -1;
        return direction === "asc"
          ? (a[column] ?? "") > (b[column] ?? "")
            ? 1
            : -1
          : (a[column] ?? "") < (b[column] ?? "")
            ? 1
            : -1;
      })
    );
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}-${d.getDate()}`;
  };

  const SortIcon = ({ direction }: { direction: "asc" | "desc" | null }) => (
    <span style={{ marginLeft: "auto" }}>
      {direction === "asc" ? "🡩" : direction === "desc" ? "🡣" : null}
    </span>
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPageNumbers = () => {
    const search = searchTerm.toLowerCase();
    const filtered = events.filter((event) =>
      Object.values(event).some(
        (value) =>
          value === null ||
          value === undefined ||
          value.toString().toLowerCase().includes(search)
      )
    );
    const pageCount = Math.ceil(filtered.length / eventsPerPage);
    if (pageCount <= 1) {
      return null;
    }
    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < pageCount ? currentPage + 1 : null;

    return (
      <div className="flex items-center justify-center space-x-1">
        {prevPage && (
          <button
            className="rounded-full bg-[#505050] p-2 text-white hover:bg-[#404040]"
            onClick={() => handlePageChange(prevPage)}
          >
            {"<"}
          </button>
        )}
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            className={`rounded-full px-3 py-2 text-white hover:bg-[#404040] ${
              currentPage === number ? "bg-[#303030]" : "bg-[#505050]"
            }`}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </button>
        ))}
        {nextPage && (
          <button
            className="rounded-full bg-[#505050] p-2 text-white hover:bg-[#404040]"
            onClick={() => handlePageChange(nextPage)}
          >
            {">"}
          </button>
        )}
      </div>
    );
  };

  const formatTitle = (title: string) => {
    switch (title) {
      case "eventdatetime":
        return "Event Date Time";
      case "registrationfee":
        return "Registration Fee";
      case "createdat":
        return "Created At";
      default:
        return title.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        {events.length > 0 && (
          <input
            className="my-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page number
            }}
            aria-label="Search events"
          />
        )}
        {events.length > 10 && <div className="my-4">{renderPageNumbers()}</div>}
      </div>
      <div className="overflow-x-auto rounded-lg">
        {filteredEvents.length > 0 ? (
          <table className="min-w-full text-white" style={{ tableLayout: "fixed" }}>
            <thead className="bg-[#505050]">
              <tr>
                <th style={{ width: "30px" }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    aria-label="Select all events"
                  />
                </th>
                {Object.keys(filteredEvents[0])
                  .filter(
                    (key) =>
                      ![
                        "eventid",
                        "adminid",
                        "organizationid",
                        "eventphoto",
                        "id",
                        "selected",
                      ].includes(key)
                  )
                  .map((key) => (
                    <th
                      key={key}
                      className="cursor-pointer border-b border-[#404040] p-3 text-left"
                      onClick={() => handleSort(key as keyof Event)}
                      style={{
                        whiteSpace: "nowrap",
                        minWidth: "150px",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <div className="flex items-center justify-start">
                        {formatTitle(key)}
                        {sortColumn === key && <SortIcon direction={sortDirection} />}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-[#404040]">
              {filteredEvents.map((event, index) => (
                <tr
                  key={event.eventid}
                  className={`${index % 2 === 0 ? "bg-[#505050]" : "bg-[#404040]"} cursor-pointer`}
                  onClick={() => handleSelectRow(event.eventid)}
                >
                  <td className="border-b border-[#404040] p-3">
                    <input
                      type="checkbox"
                      checked={!!event.selected}
                      onChange={() => handleSelectRow(event.eventid)}
                      aria-label={`Select ${event.title}`}
                    />
                  </td>
                  <td className="border-b border-[#404040] p-3">{event.title}</td>
                  <td className="border-b border-[#404040] p-3">{event.description}</td>
                  <td className="border-b border-[#404040] p-3">
                    {formatDate(event.eventdatetime)}
                  </td>
                  <td className="border-b border-[#404040] p-3">{event.location}</td>
                  <td className="border-b border-[#404040] p-3">
                    {event.registrationfee}
                  </td>
                  <td className="border-b border-[#404040] p-3">
                    {formatDate(event.createdat)}
                  </td>
                  <td className="border-b border-[#404040] p-3">{event.capacity}</td>
                  <td className="border-b border-[#404040] p-3">{event.privacy}</td>
                  <td className="border-b border-[#404040] p-3">
                    {event.tags.join(", ")}
                  </td>
                  <td className="border-b border-[#404040]">{event.eventslug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No events found.</p>
        )}
      </div>
    </>
  );
};

export default EventsTable;
