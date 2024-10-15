"use client";
import { check_permissions } from "@/lib/organization";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import EventOptions from "./event_options";
import { TableColumn } from "react-data-table-component";
import { useDebounce } from "use-debounce";
import dynamic from 'next/dynamic';
import Preloader from "../preloader";

// Dynamically import DataTable
const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});



// Import dynamic from Next.js
import dynamic from 'next/dynamic';

// Dynamically import DataTable with SSR disabled
const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

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
  const [canCreateEvents, setCanCreateEvents] = useState<boolean | null>(null); // Start with null to indicate loading state
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);

  // Redirect to the create event page for the selected organization
  const handleCreateEvent = () => {
    router.push(`/events/create/${organization.slug}`);
  };

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permission = await check_permissions(
          userId || "",
          organization.organizationid,
          "create_events"
        );
        setCanCreateEvents(permission); // Permission check resolves
      } catch (error) {
        console.error("Failed to check permissions", error);
        setCanCreateEvents(false); // On error, fallback to false
      }
    };

    // Fallback for cases where the permission check might hang
    const fallbackTimeout = setTimeout(() => {
      if (canCreateEvents === null) {
        setCanCreateEvents(false); // Assume no permission if no response within timeout
      }
    }, 100); // 5 seconds timeout

    checkPermissions();

    return () => clearTimeout(fallbackTimeout); // Cleanup the timeout
  }, [userId, organization.organizationid, canCreateEvents]);

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
      selector: (row: Event) => row.location.toLowerCase(),
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
      allowoverflow: true,
      button: true.toString(),
    },
  ];

  const filteredData = useMemo(
    () =>
      events.filter((event) => {
        if (!debouncedFilterText) return true;
        return (
          event.title.toLowerCase().includes(debouncedFilterText.toLowerCase())
        );
      }),
    [debouncedFilterText, events]
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

      <div className="mt-4 sm:mt-0 flex space-x-2"> {/* Adjusted container to align buttons */}
        {canCreateEvents && (
          <button
            onClick={handleCreateEvent}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primarydark"
          >
            Create Event
          </button>
        )}
      </div>
    </div>
  );

  if (canCreateEvents === null) {
    return <Preloader/>; // Optional loading state
  }

  return (
    <div className="py-4 sm:px-6 lg:px-8">
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
          defaultSortFieldId="title"
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
          highlightOnHover
          subHeaderComponent={subHeaderComponent}
        />
      </div>
    </div>
  );
}
