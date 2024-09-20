"use client";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import dynamic from 'next/dynamic';
import { TableColumn } from "react-data-table-component";

// Dynamically import DataTable
const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

interface Registration {
  eventregistrationid: string;
  first_name: string;
  last_name: string;
  email: string;
  event_name: string;
  organization_name: string;
  organization_slug: string;
  eventid: string;
  registrationdate: string;
  status: string;
}

interface RegistrationsTableProps {
  registrations: Registration[];
}

const RegistrationsTable: React.FC<RegistrationsTableProps> = ({
  registrations,
}) => {
  const supabase = createClient();

  const [tableData, setTableData] = useState<Registration[]>(registrations);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [orgFilter, setOrgFilter] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");

  // Unique organizations and events for filter options
  const uniqueOrganizations = Array.from(
    new Set(registrations.map((item) => item.organization_slug))
  ).map((slug) => ({
    slug,
    name: registrations.find((item) => item.organization_slug === slug)?.organization_name || '',
  }));

  const uniqueEvents = Array.from(
    new Set(registrations.map((item) => item.eventid))
  ).map((id) => ({
    id,
    name: registrations.find((item) => item.eventid === id)?.event_name || '',
  }));

  useEffect(() => {
    setTableData(registrations);
  }, [registrations]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("eventregistrations")
      .update({ status: newStatus })
      .eq("eventregistrationid", id);

    if (error) {
      toast.error("Failed to update status. Please try again.");
    } else {
      toast.success("Status updated successfully!");
      setTableData((prevData) =>
        prevData.map((registration) =>
          registration.eventregistrationid === id
            ? { ...registration, status: newStatus }
            : registration
        )
      );
    }
  };

  const columns = [
    {
      name: "Name",
      selector: (row: Registration) =>
        `${row.first_name} ${row.last_name}`,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row: Registration) => row.email,
      sortable: true,
    },
    {
      name: "Event Name",
      selector: (row: Registration) => row.event_name.toLowerCase(),
      sortable: true,
      cell: (row: Registration) => row.event_name,
    },
    {
      name: "Organization",
      selector: (row: Registration) => row.organization_name.toLowerCase(),
      sortable: true,
      cell: (row: Registration) => row.organization_name,
    },
    {
      name: "Registration Date",
      selector: (row: Registration) => row.registrationdate,
      sortable: true,
      cell: (row: Registration) =>
        format(new Date(row.registrationdate), "MMM d, yyyy h:mma"),
    },
    {
      name: "Status",
      selector: (row: Registration) => row.status,
      sortable: true,
      cell: (row: Registration) => (
        <div className="relative">
          <select
            value={row.status}
            onChange={(e) =>
              handleStatusChange(row.eventregistrationid, e.target.value)
            }
            className={`cursor-pointer rounded-2xl border px-2 py-1 pl-4 pr-6 text-xs ${
              row.status === "pending"
                ? "border-yellow-400 bg-yellow-200 text-eerieblack"
                : row.status === "registered"
                ? "border-green-400 bg-green-200 text-eerieblack"
                : ""
            }`}
          >
            <option value="pending">Pending</option>
            <option value="registered">Registered</option>
          </select>
        </div>
      ),
    },
  ];

  const filteredData = tableData.filter((item) => {
    if (
      !debouncedFilterText &&
      !statusFilter &&
      !orgFilter &&
      !eventFilter
    )
      return true;

    const name = `${item.first_name} ${item.last_name}`;
    return (
      (name.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
        item.email.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
        item.event_name.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
        item.organization_name
          .toLowerCase()
          .includes(debouncedFilterText.toLowerCase())) &&
      (!statusFilter || item.status === statusFilter) &&
      (!orgFilter || item.organization_slug === orgFilter) &&
      (!eventFilter || item.eventid === eventFilter)
    );
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-light">
            Event Registrations
          </h1>
          <p className="mt-2 text-sm text-light">
            A list of all event registrations.
          </p>
        </div>
      </div>
      <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar on the Left */}
        <div className="flex items-center mb-4 sm:mb-0">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="block rounded-md border border-[#525252] bg-charleston px-3 py-2 text-light shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          />
        </div>
        {/* Filters on the Right */}
        <div className="flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 block rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="registered">Registered</option>
          </select>
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="ml-2 block rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">All Organizations</option>
            {uniqueOrganizations.map((org) => (
              <option key={org.slug} value={org.slug}>
                {org.name}
              </option>
            ))}
          </select>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="ml-2 block rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">All Events</option>
            {uniqueEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <DataTable
          columns={columns as TableColumn<unknown>[]}
          data={filteredData}
          pagination
          highlightOnHover
          customStyles={{
            table: { style: { backgroundColor: "rgb(33, 33, 33)" } },
            headRow: { style: { backgroundColor: "rgb(36, 36, 36)" } },
            headCells: { style: { color: "rgb(255, 255, 255)" } },
            rows: {
              style: { backgroundColor: "rgb(33, 33, 33)", color: "rgb(255, 255, 255)" },
              highlightOnHoverStyle: {
                backgroundColor: "rgb(44, 44, 44)",
                color: "rgb(255, 255, 255)",
                transitionDuration: "0.15s",
                transitionProperty: "background-color",
                zIndex: 1,
                position: "relative",
                overflow: "visible",
              },
            },
            pagination: {
              style: { backgroundColor: "rgb(33, 33, 33)", color: "rgb(255, 255, 255)" },
            },
          }}
        />
      </div>
    </div>
  );
};

export default RegistrationsTable;
