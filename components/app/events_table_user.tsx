"use client";
import { check_permissions } from "@/lib/organization";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import EventOptions from "./event_options";
import { TableColumn } from "react-data-table-component";
import { useDebounce } from "use-debounce";
import dynamic from 'next/dynamic';
import Loader from "@/components/Loader";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EventsFilterDropdown from "./event-filters-dropdown";

const supabase = createClient();

const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});

interface EventFilters {
  privacy: string[];
  status: string[];
  location: string[];
  dateRange: "all" | "upcoming" | "past" | "today";
}

const fmtDate = (utcString: string) =>
  new Date(utcString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const privacyLabel = (privacy: Event["privacy"]) =>
  privacy && typeof privacy === "object" && privacy.type === "public"
    ? "Public"
    : "Private";

const statusClasses = (status: string | null | undefined) => {
  switch ((status ?? "").trim().toLowerCase()) {
    case "ongoing":
      return "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500";
    case "closed":
      return "bg-red-600/25 text-red-300 border-red-700 focus:border-red-700 focus:ring-red-700";
    default:
      return "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:ring-green-700";
  }
};

const CustomPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex items-center justify-between px-4 py-3 bg-charleston sm:hidden rounded-lg">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-eerieblack rounded-md hover:bg-opacity-80 disabled:opacity-50"
    >
      Previous
    </button>
    <span className="text-sm text-gray-300">
      Page {currentPage} of {totalPages}
    </span>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-eerieblack rounded-md hover:bg-opacity-80 disabled:opacity-50"
    >
      Next
    </button>
  </div>
);

const SelectStyle = () => (
  <style jsx>{`
    select {
      appearance: none;
      background-image: none;
      outline: none;
      background-color: transparent;
    }
    select option {
      background-color: #2a2a2a;
      color: #ffffff;
      text-align: center;
      margin: 0;
    }
  `}</style>
);

export default function EventsTableUser({
  organization,
  events,
  userId,
}: {
  organization: Organization;
  events: Event[];
  userId: string;
}) {
  const router = useRouter();

  const [canCreateEvents, setCanCreateEvents] = useState<boolean | null>(null);
  const [canEditEvents, setCanEditEvents] = useState<boolean | null>(null);

  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);

  const [tableData, setTableData] = useState<Event[]>(events);
  useEffect(() => {
    setTableData(events);
  }, [events]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState<EventFilters>({
    privacy: [],
    status: [],
    location: [],
    dateRange: "all",
  });

  // Get unique locations
  const uniqueLocations = useMemo(
    () => [...new Set(tableData.map((e) => e.location).filter(Boolean))],
    [tableData]
  );

  useEffect(() => {
    let cancelled = false;

    const checkPermissions = async () => {
      try {
        const [createPerm, editPerm] = await Promise.all([
          check_permissions(userId, organization.organizationid, "create_events"),
          check_permissions(userId, organization.organizationid, "edit_events"),
        ]);
        if (!cancelled) {
          setCanCreateEvents(createPerm);
          setCanEditEvents(editPerm);
        }
      } catch (error) {
        console.error("Failed to check permissions", error);
        if (!cancelled) {
          setCanCreateEvents(false);
          setCanEditEvents(false);
        }
      }
    };

    const fallbackTimeout = setTimeout(() => {
      if (!cancelled) {
        setCanCreateEvents((prev) => (prev === null ? false : prev));
        setCanEditEvents((prev) => (prev === null ? false : prev));
      }
    }, 5000);

    checkPermissions();

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimeout);
    };
  }, [userId, organization.organizationid]);

  const handleCreateEvent = useCallback(() => {
    router.push(`/events/create/${organization.slug}`);
  }, [router, organization.slug]);

  const handleStatusChange = useCallback(
    async (id: string, newStatus: string) => {
      if (!canEditEvents) {
        toast.error("You do not have permission to edit this event.");
        return;
      }

      const { error } = await supabase
        .from("events")
        .update({ status: newStatus, manualstatus: true })
        .eq("eventid", id);

      if (error) {
        toast.error("Failed to update status. Please try again.");
      } else {
        toast.success("Status updated successfully!");
        setTableData((prev) =>
          prev.map((event) =>
            event.eventid === id
              ? { ...event, status: newStatus, manualstatus: true }
              : event
          )
        );
      }
    },
    [canEditEvents]
  );

  const columns = useMemo<TableColumn<Event>[]>(
    () => [
      {
        name: "Title",
        selector: (row) => row.title.toLowerCase(),
        sortable: true,
        cell: (row) => row.title,
      },
      {
        name: "Start Date & Time",
        selector: (row) => row.starteventdatetime ?? "",
        sortable: true,
        cell: (row) => (row.starteventdatetime ? fmtDate(row.starteventdatetime) : "—"),
      },
      {
        name: "End Date & Time",
        selector: (row) => row.endeventdatetime ?? "",
        sortable: true,
        cell: (row) => (row.endeventdatetime ? fmtDate(row.endeventdatetime) : "—"),
      },
      {
        name: "Location",
        selector: (row) => row.location?.toLowerCase() ?? "",
        sortable: true,
      },
      {
        name: "Registration Fee",
        selector: (row) => row.registrationfee ?? "N/A",
        sortable: true,
      },
      {
        name: "Capacity",
        selector: (row) => row.capacity ?? "N/A",
        sortable: true,
      },
      {
        name: "Privacy",
        selector: (row) => privacyLabel(row.privacy),
        sortable: true,
      },
      {
        name: "Status",
        selector: (row) => row.status ?? "",
        sortable: true,
        cell: (row) =>
          canEditEvents ? (
            <div className="relative">
              <select
                value={row.status}
                onChange={(e) => handleStatusChange(row.eventid, e.target.value)}
                className={`text-center cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs ${statusClasses(
                  row.status
                )}`}
              >
                <option value="Open">Open</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Closed">Closed</option>
              </select>
              <SelectStyle />
            </div>
          ) : (
            <span
              className={`text-center rounded-2xl border-2 px-4 py-1 text-xs ${statusClasses(
                row.status
              )}`}
            >
              {row.status}
            </span>
          ),
      },
      {
        name: "",
        cell: (row) => <EventOptions selectedEvent={row} userId={userId} />,
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
      },
    ],
    [canEditEvents, handleStatusChange, userId]
  );

  // Apply all filters
  const applyFilters = (eventsToFilter: Event[]): Event[] => {
    return eventsToFilter.filter((event) => {
      // Search filter
      if (
        debouncedFilterText &&
        !event.title
          .toLowerCase()
          .includes(debouncedFilterText.toLowerCase())
      ) {
        return false;
      }

      // Privacy filter
      if (filters.privacy.length > 0) {
        const eventPrivacy = privacyLabel(event.privacy);
        if (!filters.privacy.includes(eventPrivacy)) {
          return false;
        }
      }

 // Status filter
if (filters.status.length > 0) {
  const eventStatus = event.status ?? ""; // Default to empty string if undefined
  if (!filters.status.includes(eventStatus)) {
    return false;
  }
}

      // Location filter
      if (filters.location.length > 0) {
        if (!filters.location.includes(event.location)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange !== "all") {
        const eventDate = new Date(event.starteventdatetime);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (filters.dateRange) {
          case "upcoming":
            if (eventDate < today) {
              return false;
            }
            break;
          case "past":
            if (eventDate >= today) {
              return false;
            }
            break;
          case "today":
            const eventDateOnly = new Date(eventDate);
            eventDateOnly.setHours(0, 0, 0, 0);
            if (eventDateOnly.getTime() !== today.getTime()) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  };

  const filteredData = applyFilters(tableData);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const renderMobileCard = useCallback(
    (row: Event) => (
      <div className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252] relative">
        <div className="space-y-2">
          {(
            [
              ["Title", row.title],
              [
                "Start Date & Time",
                row.starteventdatetime ? fmtDate(row.starteventdatetime) : "—",
              ],
              [
                "End Date & Time",
                row.endeventdatetime ? fmtDate(row.endeventdatetime) : "—",
              ],
              ["Location", row.location],
              ["Registration Fee", String(row.registrationfee || "N/A")],
              ["Capacity", String(row.capacity || "N/A")],
              ["Privacy", privacyLabel(row.privacy)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label}>
              <span className="text-gray-400">{label}:</span>{" "}
              <span className="text-white">{value}</span>
            </div>
          ))}

          <div>
            <span className="text-gray-400">Status:</span>{" "}
            {canEditEvents ? (
              <div className="relative inline-block">
                <select
                  value={row.status}
                  onChange={(e) =>
                    handleStatusChange(row.eventid, e.target.value)
                  }
                  className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs ml-2 ${statusClasses(
                    row.status
                  )}`}
                >
                  <option value="Open">Open</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Closed">Closed</option>
                </select>
                <SelectStyle />
              </div>
            ) : (
              <span
                className={`text-center rounded-2xl border-2 px-4 py-1 text-xs ml-2 ${statusClasses(
                  row.status
                )}`}
              >
                {row.status}
              </span>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 right-4">
          <EventOptions selectedEvent={row} userId={userId} />
        </div>
      </div>
    ),
    [canEditEvents, handleStatusChange, userId]
  );

  if (canCreateEvents === null || canEditEvents === null) {
    return <Loader />;
  }

  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-base font-semibold leading-6 text-light">
            Events
          </h1>
          <p className="mt-2 text-sm text-light">
            A list of all the events including their title, date and time,
            location, registration fee, capacity, and privacy.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 rounded-md border border-[#525252] bg-charleston px-3 py-2 text-light shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-sm"
          />
          <EventsFilterDropdown
            onFiltersChange={setFilters}
            locations={uniqueLocations}
          />
          {canCreateEvents && (
            <button
              onClick={handleCreateEvent}
              className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primarydark whitespace-nowrap"
            >
              Create Event
            </button>
          )}
        </div>

        {/* Mobile view */}
        <div className="block sm:hidden">
          {paginatedData.map((row) => (
            <div key={row.eventid}>{renderMobileCard(row)}</div>
          ))}
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Desktop view */}
        <div className="hidden sm:block">
          <DataTable
            columns={columns as unknown as TableColumn<unknown>[]}
            data={filteredData}
            pagination
            highlightOnHover
            customStyles={{
              header: {
                style: {
                  backgroundColor: "rgb(36, 36, 36)",
                  color: "rgb(255, 255, 255)",
                },
              },
              subHeader: {
                style: {
                  backgroundColor: "none",
                  color: "rgb(255, 255, 255)",
                  padding: 0,
                  marginBottom: 10,
                },
              },
              rows: {
                style: {
                  minHeight: "6vh",
                  backgroundColor: "rgb(33, 33, 33)",
                  color: "rgb(255, 255, 255)",
                },
              },
              headCells: {
                style: {
                  backgroundColor: "rgb(36, 36, 36)",
                  color: "rgb(255, 255, 255)",
                },
              },
              cells: {
                style: {
                  backgroundColor: "rgb(33, 33, 33)",
                  color: "rgb(255, 255, 255)",
                },
              },
              pagination: {
                style: {
                  backgroundColor: "rgb(33, 33, 33)",
                  color: "rgb(255, 255, 255)",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
