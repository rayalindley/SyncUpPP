"use client";
import { check_permissions } from "@/lib/organization";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import EventOptions from "./event_options"; // Assuming you have EventOptions component
import dynamic from 'next/dynamic';
import { useDebounce } from "use-debounce";
import { TableColumn } from "react-data-table-component";

// Dynamically import DataTable
const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});


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
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);

  // Filter events based on the selected organization ID
  const filteredEvents = selectedOrgId
    ? events.filter((event) => event.organizationid === selectedOrgId)
    : events; // If no organization is selected, show all events

  // Redirect to the create event page for the selected organization
  const handleCreateEvent = () => {
    // Find the slug for the selected organization
    const selectedOrgSlug = organizations.find(
      (org) => org.organizationid === selectedOrgId
    )?.slug;
    if (selectedOrgSlug) {
      router.push(`/events/create/${selectedOrgSlug}`);
    }
  };

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permission = await check_permissions(
          userId || "",
          selectedOrgId,
          "create_events"
        );
        setCanCreateEvents(permission);
      } catch (error) {
        console.error("Failed to check permissions", error);
      }
    };

    checkPermissions();
  }, [userId, selectedOrgId]);

  // Convert event datetime to PST
  const formattedDateTime = (utcDateString: string) => {
    const date = new Date(utcDateString);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Define columns for the data table
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
      cell: (row: Event) => new Date(row.starteventdatetime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),
    },
    {
      name: "End Date & Time",
      selector: (row: Event) => row.endeventdatetime,
      sortable: true,
      cell: (row: Event) => new Date(row.endeventdatetime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),

    },
    {
      name: "Location",
      selector: (row: Event) => row.location.toLocaleLowerCase(),
      sortable: true,
    },
    {
      name: "Registration Fee",
      selector: (row: Event) => row.registrationfee || "N/A",
      sortable: true,
    },
    {
      name: "Capacity",
      selector: (row: Event) => row.capacity || "N/A",
      sortable: true,
    },
    {
      name: "Privacy",
      selector: (row: Event) => {
        const privacyInfo =
          row.privacy && typeof row.privacy === "object" && row.privacy.type === "public"
            ? "Public"
            : "Private";
        return privacyInfo;
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

  const filteredData = useMemo(
    () =>
      filteredEvents.filter((event) => {
        if (!debouncedFilterText) return true;
        return (
          event.title.toLowerCase().includes(debouncedFilterText.toLowerCase())
        );
      }),
    [debouncedFilterText, filteredEvents]
  );

  const subHeaderComponent = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
          <input
      type="text"
      placeholder="Search..."
      value={filterText}
      onChange={(e) => setFilterText(e.target.value)}
      className="block rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
    />

    <div className="mt-4 sm:flex sm:items-center sm:space-x-2">
    {/* Dropdown for selecting organization */}
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
    {canCreateEvents && (
      <button
        onClick={handleCreateEvent}
        disabled={!selectedOrgId} // Button is disabled if no organization is selected
        className={`rounded-md px-4 py-2 text-sm text-white ${
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="justify-between sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-light">Events</h1>
          <p className="mt-2 text-sm text-light">
            A list of all the events including their title, date and time, location,
            registration fee, capacity, and privacy.
          </p>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <DataTable
          columns={columns as TableColumn<unknown>[]}
          data={filteredData}
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
          pagination
          subHeader
          subHeaderComponent={subHeaderComponent}
          highlightOnHover
        />
      </div>
    </div>
  );
}