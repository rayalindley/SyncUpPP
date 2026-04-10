"use client";
import { check_permissions } from "@/lib/organization";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import EventOptions from "./event_options";
import dynamic from 'next/dynamic';
import { useDebounce } from "use-debounce";
import { TableColumn } from "react-data-table-component";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EventsFilterDropdown from "./event-filters-dropdown";

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
}) as any;

const supabase = createClient();

interface EventFilters {
  privacy: string[];
  status: string[];
  location: string[];
  dateRange: "all" | "upcoming" | "past" | "today";
}

const CustomPagination = ({ currentPage, totalPages, onPageChange }: any) => (
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

export default function EventsTable({
  organizations,
  events,
  userId,
}: {
  organizations: Organization[];
  events: Event[];
  userId: string;
}) {
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const router = useRouter();
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [canEditEvents, setCanEditEvents] = useState(false);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [tableData, setTableData] = useState<Event[]>(events);
  const [filters, setFilters] = useState<EventFilters>({
    privacy: [],
    status: [],
    location: [],
    dateRange: "all",
  });

  // ✅ Get unique locations from events - Filter out undefined and ensure string array
  const uniqueLocations: string[] = useMemo(
    () => {
      const locations = tableData
        .map((e) => e.location)
        .filter((loc): loc is string => Boolean(loc && typeof loc === "string"));
      return [...new Set(locations)];
    },
    [tableData]
  );

  // Filter events based on the selected organization ID
  const filteredByOrg = selectedOrgId
    ? tableData.filter((event) => event.organizationid === selectedOrgId)
    : tableData;

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
        const eventPrivacy =
          event.privacy &&
          typeof event.privacy === "object" &&
          event.privacy.type === "public"
            ? "Public"
            : "Private";
        if (!filters.privacy.includes(eventPrivacy)) {
          return false;
        }
      }

      // ✅ Status filter with case-insensitive comparison
      if (filters.status.length > 0) {
        const eventStatus = event.status ? event.status.trim().toLowerCase() : "";
        const normalizedFilters = filters.status.map((s: string) => s.toLowerCase());
        if (!normalizedFilters.includes(eventStatus)) {
          return false;
        }
      }

      // ✅ Location filter - Handle undefined
      if (filters.location.length > 0) {
        if (!event.location || !filters.location.includes(event.location)) {
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

  const filteredData = applyFilters(filteredByOrg);

  const handleCreateEvent = () => {
    const selectedOrgSlug = organizations.find(
      (org) => org.organizationid === selectedOrgId
    )?.slug;
    if (selectedOrgSlug) {
      router.push(`/events/create/${selectedOrgSlug}`);
    }
  };

  useEffect(() => {
    const checkPermissions = async () => {
      if (!selectedOrgId) {
        setCanCreateEvents(false);
        setCanEditEvents(false);
        return;
      }

      try {
        const createPermission = await check_permissions(
          userId || "",
          selectedOrgId,
          "create_events"
        );
        setCanCreateEvents(createPermission);

        const editPermission = await check_permissions(
          userId || "",
          selectedOrgId,
          "edit_events"
        );
        setCanEditEvents(editPermission);
      } catch (error) {
        console.error("Failed to check permissions", error);
        setCanCreateEvents(false);
        setCanEditEvents(false);
      }
    };

    checkPermissions();
  }, [userId, selectedOrgId]);

  // ✅ Handle status change with proper ID column
  const handleStatusChange = async (eventId: string | undefined, newStatus: string) => {
    if (!eventId) {
      toast.error("Event ID is missing.");
      return;
    }

    if (!selectedOrgId) {
      toast.error("Please select an organization to edit the event status.");
      return;
    }

    if (!canEditEvents) {
      toast.error("You do not have permission to edit this event.");
      return;
    }

    try {
      const { error } = await supabase
        .from("events")
        .update({
          status: newStatus.trim(),
          manualstatus: true,
        })
        .eq("id", eventId);

      if (error) {
        console.error("Update error:", error);
        toast.error("Failed to update status. Please try again.");
        return;
      }

      toast.success("Status updated successfully!");
      setTableData((prevData) =>
        prevData.map((event) =>
          event.id === eventId || event.eventid === eventId
            ? { ...event, status: newStatus.trim(), manualstatus: true }
            : event
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An error occurred while updating the status.");
    }
  };

  const columns = [
    {
      name: "Title",
      selector: (row: Event) => row.title.toLowerCase(),
      sortable: true,
      cell: (row: Event) => row.title,
    },
    {
      name: "Start Date & Time",
      selector: (row: Event) => row.starteventdatetime,
      sortable: true,
      cell: (row: Event) =>
        new Date(row.starteventdatetime).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
    },
    {
      name: "End Date & Time",
      selector: (row: Event) => row.endeventdatetime,
      sortable: true,
      cell: (row: Event) =>
        new Date(row.endeventdatetime).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
    },
    {
      name: "Location",
      selector: (row: Event) => (row.location || "").toLowerCase(),
      sortable: true,
      cell: (row: Event) => row.location || "N/A",
    },
    {
      name: "Registration Fee",
      selector: (row: Event) => row.registrationfee || 0,
      sortable: true,
      cell: (row: Event) => (row.registrationfee ? `PHP ${row.registrationfee}` : "Free"),
    },
    {
      name: "Capacity",
      selector: (row: Event) => row.capacity || 0,
      sortable: true,
      cell: (row: Event) => row.capacity || "Unlimited",
    },
    {
      name: "Privacy",
      selector: (row: Event) => {
        const privacyInfo =
          row.privacy &&
          typeof row.privacy === "object" &&
          row.privacy.type === "public"
            ? "Public"
            : "Private";
        return privacyInfo;
      },
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: Event) => row.status || "Open",
      cell: (row: Event) => {
        const status = (row.status || "Open").trim().toLowerCase();

        return (
          <div className="relative">
            <select
              value={row.status || "Open"}
              onChange={(e) => handleStatusChange(row.id || row.eventid, e.target.value)}
              className={`text-center cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs 
                ${
                  status === "ongoing"
                    ? "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500"
                    : status === "open"
                      ? "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:ring-green-700"
                      : status === "closed"
                        ? "bg-red-600/25 text-red-300 border-red-700 focus:border-red-700 focus:ring-red-700"
                        : "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:ring-green-700"
                }`}
            >
              <option value="Open">Open</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Closed">Closed</option>
            </select>
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
          </div>
        );
      },
      sortable: true,
    },
    {
      name: "",
      cell: (row: Event) => (
        <EventOptions selectedEvent={row} userId={userId} />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const subHeaderComponent = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="rounded-md bg-charleston text-sm text-light shadow-sm ring-primary hover:bg-raisinblack focus:ring-2 focus:ring-primary"
        >
          <option value="">All Organizations</option>
          {organizations.map((org) => (
            <option key={org.organizationid} value={org.organizationid}>
              {org.name}
            </option>
          ))}
        </select>
        <EventsFilterDropdown
          onFiltersChange={setFilters}
          locations={uniqueLocations}
        />
        {canCreateEvents && (
          <button
            onClick={handleCreateEvent}
            disabled={!selectedOrgId}
            className={`rounded-md px-4 py-2 text-sm text-white whitespace-nowrap ${
              selectedOrgId
                ? "bg-primary hover:bg-primarydark"
                : "cursor-not-allowed bg-gray-500"
            }`}
          >
            Create Event
          </button>
        )}
      </div>
    </div>
  );

  const mobileCard = (row: Event) => (
    <div className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252] relative">
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Title:</span>{" "}
          <span className="text-white">{row.title}</span>
        </div>
        <div>
          <span className="text-gray-400">Start Date & Time:</span>{" "}
          <span className="text-white">
            {new Date(row.starteventdatetime).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })}
          </span>
        </div>
        <div>
          <span className="text-gray-400">End Date & Time:</span>{" "}
          <span className="text-white">
            {new Date(row.endeventdatetime).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Location:</span>{" "}
          <span className="text-white">{row.location || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-400">Registration Fee:</span>{" "}
          <span className="text-white">
            {row.registrationfee ? `PHP ${row.registrationfee}` : "Free"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Capacity:</span>{" "}
          <span className="text-white">{row.capacity || "Unlimited"}</span>
        </div>
        <div>
          <span className="text-gray-400">Privacy:</span>{" "}
          <span className="text-white">
            {row.privacy &&
            typeof row.privacy === "object" &&
            row.privacy.type === "public"
              ? "Public"
              : "Private"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Status:</span>{" "}
          <div className="relative inline-block">
            <select
              value={row.status || "Open"}
              onChange={(e) => handleStatusChange(row.id || row.eventid, e.target.value)}
              className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs ml-2
                ${
                  (row.status || "Open").trim().toLowerCase() === "ongoing"
                    ? "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                    : (row.status || "Open").trim().toLowerCase() === "open"
                      ? "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:outline-none focus:ring-green-700"
                      : "bg-red-600/25 text-red-300 border-red-700 focus:border-red-700 focus:outline-none focus:ring-red-700"
                }`}
            >
              <option value="Open">Open</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Closed">Closed</option>
            </select>
            <style jsx>{`
              select {
                appearance: none;
                background-image: none;
                outline: none;
              }
              select option {
                background-color: #2a2a2a;
                color: inherit;
                text-align: center;
                margin: 0;
                padding: 8px;
              }
            `}</style>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 right-4">
        <EventOptions selectedEvent={row} userId={userId} />
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8">
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
        {/* Mobile filters - show only on mobile */}
        <div className="block sm:hidden">
          {subHeaderComponent}
        </div>
      </div>

      <div className="mt-8">
        {/* Mobile view */}
        <div className="block sm:hidden">
          {filteredData.length === 0 ? (
            <div className="bg-charleston border border-fadedgrey rounded-lg p-6 text-center">
              <p className="text-gray-400">No events found</p>
            </div>
          ) : (
            <>
              {filteredData.map((row, index) => (
                <div key={index}>{mobileCard(row)}</div>
              ))}
              <CustomPagination
                currentPage={1}
                totalPages={Math.ceil(filteredData.length / 10)}
                onPageChange={(page: number) => {
                  /* Handle page change */
                }}
              />
            </>
          )}
        </div>

        {/* Desktop view */}
        <div className="hidden sm:block">
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
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
            subHeader
            subHeaderComponent={subHeaderComponent}
            highlightOnHover
          />
        </div>
      </div>
    </div>
  );
}