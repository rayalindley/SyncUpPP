"use client";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import dynamic from 'next/dynamic';
import { TableColumn } from "react-data-table-component";
import { saveAs } from 'file-saver';

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
  organization_slug: string;
  eventid: string;
  registrationdate: string;
  status: string;
  attendance: string | null; // Modified to allow null for empty values
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
  const [eventFilter, setEventFilter] = useState<string>("");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("");

  // Unique events for filter options
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

  const handleAttendanceChange = async (id: string, newAttendance: string) => {
    const { error } = await supabase
      .from("eventregistrations")
      .update({ attendance: newAttendance })
      .eq("eventregistrationid", id);

    if (error) {
      toast.error("Failed to update attendance. Please try again.");
    } else {
      toast.success("Attendance updated successfully!");
      setTableData((prevData) =>
        prevData.map((registration) =>
          registration.eventregistrationid === id
            ? { ...registration, attendance: newAttendance }
            : registration
        )
      );
    }
  };

  // Function to export filtered data to CSV
  const exportToCSV = () => {
    const exportData = filteredData.map((item) => ({
      Name: `${item.first_name} ${item.last_name}`,
      Email: item.email,
      "Registration Date": `"${format(new Date(item.registrationdate), "MMM d, yyyy h:mma")}"`, // Wrap date in quotes
      Status: item.status,
      Attendance: item.attendance || "Set",
    }));

    const csvContent = [
      ["Name", "Email", "Registration Date", "Status", "Attendance"],
      ...exportData.map(item => [
        item.Name,
        item.Email,
        item["Registration Date"],
        item.Status,
        item.Attendance
      ]),
    ]
      .map(e => e.join(","))
      .join("\n");

    const event = uniqueEvents.find(e => e.id === eventFilter);
    const fileName = `${event?.name || 'event'}_registrations_${format(new Date(), "yyyy-MM-dd")}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, fileName);
  };

  const columns: TableColumn<Registration>[] = [
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
    {
      name: "Attendance",
      selector: (row: Registration) => row.attendance || "Set",
      sortable: true,
      cell: (row: Registration) => (
        <div className="relative">
          <select
            value={row.attendance || "Set"} // Display "Set" for empty values
            onChange={(e) =>
              handleAttendanceChange(row.eventregistrationid, e.target.value)
            }
            className={`cursor-pointer rounded-2xl border px-2 py-1 pl-4 pr-6 text-xs ${
              row.attendance === "present"
                ? "border-green-400 bg-green-200 text-eerieblack"
                : row.attendance === "absent"
                ? "border-red-400 bg-red-200 text-eerieblack"
                : row.attendance === "late"
                ? "border-yellow-400 bg-yellow-200 text-eerieblack"
                : "border-gray-400 bg-gray-200 text-eerieblack" // Default for "Set"
            }`}
          >
            <option value="Set">Set</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
      ),
    },
  ];

  const filteredData = tableData.filter((item) => {
    if (!debouncedFilterText && !statusFilter && !eventFilter && !attendanceFilter)
      return true;

    const name = `${item.first_name} ${item.last_name}`;
    return (
      (name.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
        item.email.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
        item.event_name.toLowerCase().includes(debouncedFilterText.toLowerCase())) &&
      (!statusFilter || item.status === statusFilter) &&
      (!eventFilter || item.eventid === eventFilter) &&
      (!attendanceFilter || item.attendance === attendanceFilter)
    );
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="mt-6 text-base font-semibold leading-6 text-light">
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
        {/* Filters and Export Button on the Right */}
        <div className="flex items-center">
          {eventFilter && (
            <button
              onClick={exportToCSV}
              className="mr-2 block rounded-md bg-primary text-white px-3 py-2 text-sm shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              Export
            </button>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 block rounded-md border border-[#525252] bg-charleston pl-3 pr-8 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="registered">Registered</option>
          </select>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="ml-2 block rounded-md border border-[#525252] bg-charleston pl-3 pr-8 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">All Events</option>
            {uniqueEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="ml-2 block rounded-md border border-[#525252] bg-charleston pl-3 pr-8 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">All Attendance</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
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
