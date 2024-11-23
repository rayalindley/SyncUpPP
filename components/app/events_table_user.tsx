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
import { createClient } from "@/lib/supabase/client"; // Import Supabase client
import { toast } from "react-toastify"; // Import toast for notifications
import "react-toastify/dist/ReactToastify.css"; // Import toast styles


const supabase = createClient(); // Initialize Supabase client

// Dynamically import DataTable with SSR disabled
const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

// Add this new component near the top of the file
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
  const [canEditEvents, setCanEditEvents] = useState<boolean | null>(null); // New state for edit permission
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [tableData, setTableData] = useState<Event[]>(events);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleCreateEvent = () => {
    router.push(`/events/create/${organization.slug}`);
  };

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const createPermission = await check_permissions(
          userId || "",
          organization.organizationid,
          "create_events"
        );
        setCanCreateEvents(createPermission);

        const editPermission = await check_permissions(
          userId || "",
          organization.organizationid,
          "edit_events" // Check for edit permission
        );
        setCanEditEvents(editPermission);
      } catch (error) {
        console.error("Failed to check permissions", error);
        setCanCreateEvents(false);
        setCanEditEvents(false); // Set edit permission to false on error
      }
    };

    const fallbackTimeout = setTimeout(() => {
      if (canCreateEvents === null) {
        setCanCreateEvents(false);
      }
      if (canEditEvents === null) {
        setCanEditEvents(false);
      }
    }, 5000);

    checkPermissions();

    return () => clearTimeout(fallbackTimeout);
  }, [userId, organization.organizationid, canCreateEvents, canEditEvents]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!canEditEvents) {
      toast.error("You do not have permission to edit this event.");
      return;
    }

    const { error } = await supabase
      .from("events")
      .update({ 
        status: newStatus, 
        manualstatus: true 
      })
      .eq("eventid", id);
  
    if (error) {
      toast.error("Failed to update status. Please try again.");
    } else {
      toast.success("Status updated successfully!");
      setTableData((prevData) =>
        prevData.map((event) =>
          event.eventid === id ? { ...event, status: newStatus, manualstatus: true } : event
        )
      );
    }
  };
  
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
        const privacyInfo = row.privacy && typeof row.privacy === "object" && row.privacy.type === "public" ? "Public" : "Private";
        return privacyInfo;
      },
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: Event) => row.status,
      cell: (row: Event) => {
        // Normalize the status value
        const status = row.status ? row.status.trim().toLowerCase() : "";
    
        return (
          <div className="relative">
            <select
              value={row.status}
              onChange={(e) => handleStatusChange(row.eventid, e.target.value)}
              className={`text-center cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs 
                ${
                  status === "ongoing"
                    ? "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500"
                  : status === "open"
                    ? "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:ring-green-700"
                  : status === "closed"
                    ? "bg-red-600/25 text-red-300 border-red-700 focus:border-red-700 focus:ring-red-700"
                  // Default styling if status doesn't match expected values
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
  ] as TableColumn<Event>[];

  const filteredData = useMemo(
    () =>
      tableData.filter((event) => {
        if (!debouncedFilterText) return true;
        return (
          event.title.toLowerCase().includes(debouncedFilterText.toLowerCase())
        );
      }),
    [debouncedFilterText, tableData]
  );

  // Update the mobile view section to include pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Add mobile card rendering function
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
            {new Date(row.starteventdatetime).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric', 
              hour: 'numeric', 
              minute: 'numeric', 
              hour12: true 
            })}
          </span>
        </div>
        <div>
          <span className="text-gray-400">End Date & Time:</span>{" "}
          <span className="text-white">
            {new Date(row.endeventdatetime).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric', 
              hour: 'numeric', 
              minute: 'numeric', 
              hour12: true 
            })}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Location:</span>{" "}
          <span className="text-white">{row.location}</span>
        </div>
        <div>
          <span className="text-gray-400">Registration Fee:</span>{" "}
          <span className="text-white">{row.registrationfee || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-400">Capacity:</span>{" "}
          <span className="text-white">{row.capacity || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-400">Privacy:</span>{" "}
          <span className="text-white">
            {row.privacy && typeof row.privacy === "object" && row.privacy.type === "public" ? "Public" : "Private"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Status:</span>{" "}
          <div className="relative inline-block">
            <select
              value={row.status}
              onChange={(e) => handleStatusChange(row.eventid, e.target.value)}
              className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs ml-2
                ${row.status === "Ongoing"
                  ? "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                  : row.status === "Open"
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
                appearance: none; /* Removes default styling including arrow */
                background-image: none; /* Ensures no background images like arrow */
                outline: none; /* Removes the blue outline */
              }

              select option {
                background-color: #2a2a2a; /* Option background color */
                color: #ffffff; /* Option text color */
                text-align: center; /* Ensures text alignment inside the option */
                margin: 0; /* Removes any default margin */
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

  if (canCreateEvents === null || canEditEvents === null) {
    return <Preloader />;
  }

  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-base font-semibold leading-6 text-light">Events</h1>
          <p className="mt-2 text-sm text-light">
            A list of all the events including their title, date and time, location,
            registration fee, capacity, and privacy.
          </p>
        </div>

        {/* Search and Create Event Section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 rounded-md border border-[#525252] bg-charleston px-3 py-2 text-light shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-sm"
          />
          {canCreateEvents && (
            <button
              onClick={handleCreateEvent}
              className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primarydark"
            >
              Create Event
            </button>
          )}
        </div>

        {/* Mobile View */}
        <div className="block sm:hidden">
          {paginatedData.map((row, index) => (
            <div key={index}>{mobileCard(row)}</div>
          ))}
          <CustomPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </div>

        {/* Desktop View */}
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
