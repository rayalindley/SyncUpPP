"use client";
import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import dynamic from 'next/dynamic';
import { TableColumn } from "react-data-table-component";
import { saveAs } from 'file-saver';
import { Dialog } from "@headlessui/react";
import QrScannerComponent from "@/components/qrscanner"; // Import QR Scanner component
import { useRouter } from "next/navigation";
import { recordActivity } from "@/lib/track";

// Dynamically import DataTable
const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
}) as any;

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
  attendance: string | null; // Modified to allow null for empty values
  attendance_updated_at: string;
  has_submitted_feedback: boolean;
  feedback_submitted_at: string;
}

interface RegistrationsTableProps {
  registrations: Registration[];
}

const RegistrationsTable: React.FC<RegistrationsTableProps> = ({
  registrations,
}) => {
  const supabase = createClient();
  const router = useRouter();
  const [tableData, setTableData] = useState<Registration[]>(registrations);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [orgFilter, setOrgFilter] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("");

  const [showQrScanner, setShowQrScanner] = useState(false); // State to toggle QR scanner dialog

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleAttendanceChange = async (id: string, newAttendance: string) => {
    try {
      // Fetch registration to get event data
      const { data: registrationData, error: registrationError } = await supabase
        .from("eventregistrations")
        .select("eventid, userid")
        .eq("eventregistrationid", id)
        .single();
  
      if (registrationError || !registrationData) {
        toast.error("Failed to fetch registration details.");
        return;
      }
  
      const { eventid, userid } = registrationData;
  
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("eventid", eventid)
        .single();
  
      if (eventError || !eventData) {
        toast.error("Failed to fetch event details.");
        return;
      }
  
      // Fetch user profile
      const { data: userProfile, error: userProfileError } = await supabase
        .from("userprofiles")
        .select("*")
        .eq("userid", userid)
        .single();
  
      if (userProfileError || !userProfile) {
        toast.error("Failed to fetch user profile.");
        return;
      }
  
      // Update attendance in the database
      const { error } = await supabase
        .from("eventregistrations")
        .update({ attendance: newAttendance })
        .eq("eventregistrationid", id);
  
      if (error) {
        toast.error("Failed to update attendance. Please try again.");
        return;
      }
  
      toast.success("Attendance updated successfully!");
  
      // Determine the description based on the attendance state
      const attendanceDescription = {
        present: `marked as present`,
        absent: `marked as absent`,
        late: `marked as late`,
      }[newAttendance] || `updated attendance`;
  
      // Log user activity
      await recordActivity({
        activity_type: "event_attendance",
        description: `User ${attendanceDescription} for event: ${eventData.title}`,
      });
  
      // Log organization activity
      await recordActivity({
        activity_type: "event_attendance",
        organization_id: eventData.organizationid,
        description: `User ${userProfile.first_name} ${userProfile.last_name} ${attendanceDescription} for event: ${eventData.title}`,
      });
  
      // Update the local state to reflect the new attendance
      setTableData((prevData) =>
        prevData.map((registration) =>
          registration.eventregistrationid === id
            ? { ...registration, attendance: newAttendance }
            : registration
        )
      );
    } catch (err) {
      console.error("Error marking attendance:", err);
      toast.error("An error occurred. Please try again.");
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
    // {
    //   name: "Event Name",
    //   selector: (row: Registration) => row.event_name.toLowerCase(),
    //   sortable: true,
    //   cell: (row: Registration) => row.event_name,
    // },
    // {
    //   name: "Organization",
    //   selector: (row: Registration) => row.organization_name.toLowerCase(),
    //   sortable: true,
    //   cell: (row: Registration) => row.organization_name,
    // },
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
            className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 !px-4 py-1 text-xs
              ${row.status === "pending"
                ? "border-yellow-500 text-yellow-300"
                : "border-green-700 text-green-300"
              }`}
          >
            <option value="registered">Registered</option>
            <option value="pending">Pending</option>
          </select>
          <style jsx>{`
                select {
                  appearance: none !important;
                  -webkit-appearance: none !important;
                  -moz-appearance: none !important;
                  background-image: none !important;
                  outline: none;
                }

                /* Remove dropdown arrow in IE/Edge */
                select::-ms-expand {
                  display: none;
                }

                select option {
                  background-color: #2a2a2a !important;
                  color: #ffffff !important;
                  text-align: center;
                  margin: 0;
                  padding: 8px;
                }
        `}</style>
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
            className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs
              ${row.attendance === "present"
                ? "border-green-700 text-green-300"
                : row.attendance === "absent"
                ? "border-red-700 text-red-300"
                : row.attendance === "late"
                ? "border-yellow-500 text-yellow-300"
                : "border-[#525252] text-light"
              }`}
          >
            <option value="Set">Set</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
            <style jsx>{`
                select {
                  appearance: none !important;
                  -webkit-appearance: none !important;
                  -moz-appearance: none !important;
                  background-image: none !important;
                  outline: none;
                }

                /* Remove dropdown arrow in IE/Edge */
                select::-ms-expand {
                  display: none;
                }

                select option {
                  background-color: #2a2a2a !important;
                  color: #ffffff !important;
                  text-align: center;
                  margin: 0;
                  padding: 8px;
                }
            `}</style>
        </div>

      ),
    },
    {
      name: "Attendance Updated At",
      selector: (row: Registration) => row.attendance_updated_at,
      sortable: true,
      cell: (row: Registration) => {
        const attendanceDate = new Date(row.attendance_updated_at);
        return attendanceDate.getTime() === 0 ? "" : format(attendanceDate, "MMM d, yyyy h:mma");
      },
    },
    {
      name: "Feedback Submitted At",
      selector: (row: Registration) => row.feedback_submitted_at,
      sortable: true,
      cell: (row: Registration) => {
        const feedbackDate = new Date(row.feedback_submitted_at);
        return isNaN(feedbackDate.getTime()) ? "" : format(feedbackDate, "MMM d, yyyy h:mma");
      },
    },
  ];

  const filteredData = tableData.filter((item) => {
    if (!debouncedFilterText && !statusFilter && !orgFilter && !eventFilter && !attendanceFilter)
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
      (!eventFilter || item.eventid === eventFilter) &&
      (!attendanceFilter || item.attendance === attendanceFilter)
    );
  });

  const handleQrScan = async (scannedResult: string) => {
    try {
      // Extract the user ID and event ID from the scanned QR code URL
      const url = new URL(scannedResult);
      const scannedUserId = url.searchParams.get("uid");
      const scannedEventId = url.searchParams.get("event");

      if (scannedUserId && scannedEventId) {
        // Redirect to the attendance page with the scanned user ID and event ID
        router.push(`/attendance?uid=${scannedUserId}&event=${scannedEventId}`);
      } else {
        toast.error("Invalid QR code.");
      }
    } catch (error) {
      console.error("QR Code processing error:", error); // Log QR processing error
      toast.error("Failed to process the scanned QR code.");
    }
  };

  const handleQrError = (error: Error) => {
    console.error("QR Scan Error:", error);
  };

  // Add mobileCard rendering function after the columns definition
  const mobileCard = (row: Registration) => (
    <div className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252] relative">
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Name:</span>{" "}
          <span className="text-white">{`${row.first_name} ${row.last_name}`}</span>
        </div>
        <div>
          <span className="text-gray-400">Email:</span>{" "}
          <span className="text-white">{row.email}</span>
        </div>
        <div>
          <span className="text-gray-400">Event Name:</span>{" "}
          <span className="text-white">{row.event_name}</span>
        </div>
        <div>
          <span className="text-gray-400">Organization:</span>{" "}
          <span className="text-white">{row.organization_name}</span>
        </div>
        <div>
          <span className="text-gray-400">Registration Date:</span>{" "}
          <span className="text-white">
            {format(new Date(row.registrationdate), "MMM d, yyyy h:mma")}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Status:</span>{" "}
          <div className="relative inline-block ml-2">
            <select
              value={row.status}
              onChange={(e) => handleStatusChange(row.eventregistrationid, e.target.value)}
              className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs
                ${row.status === "pending"
                  ? "border-yellow-500 text-yellow-300"
                  : "border-green-700 text-green-300"
                }`}
            >
              <option value="registered">Registered</option>
              <option value="pending">Pending</option>
            </select>
            <style jsx>{`
              select {
                appearance: none !important;
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                background-image: none !important;
                outline: none;
              }

              /* Remove dropdown arrow in IE/Edge */
              select::-ms-expand {
                display: none;
              }

              select option {
                background-color: #2a2a2a !important;
                color: #ffffff !important;
                text-align: center;
                margin: 0;
                padding: 8px;
              }
            `}</style>
          </div>
        </div>
        <div>
          <span className="text-gray-400">Attendance:</span>{" "}
          <div className="relative inline-block ml-2">
            <select
              value={row.attendance || "Set"}
              onChange={(e) => handleAttendanceChange(row.eventregistrationid, e.target.value)}
              className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs
                ${row.attendance === "present"
                  ? "border-green-700 text-green-300"
                  : row.attendance === "absent"
                  ? "border-red-700 text-red-300"
                  : row.attendance === "late"
                  ? "border-yellow-500 text-yellow-300"
                  : "border-[#525252] text-light"
                }`}
            >
              <option value="Set">Set</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
            <style jsx>{`
              select {
                appearance: none !important;
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                background-image: none !important;
                outline: none;
              }

              /* Remove dropdown arrow in IE/Edge */
              select::-ms-expand {
                display: none;
              }

              select option {
                background-color: #2a2a2a !important;
                color: #ffffff !important;
                text-align: center;
                margin: 0;
                padding: 8px;
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
      <div className="mt-10 flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search Bar */}
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full sm:w-auto rounded-md border border-[#525252] bg-charleston px-3 py-2 text-light shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
          </div>
          
          {/* Filters and Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowQrScanner(true)}
              className="rounded-md bg-primary text-white px-3 py-2 text-sm shadow-sm hover:bg-primarydark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              Scan QR
            </button>
            {eventFilter && (
              <button
                onClick={exportToCSV}
                className="rounded-md bg-primary text-white px-3 py-2 text-sm shadow-sm hover:bg-primarydark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              >
                Export
              </button>
            )}
          </div>
        </div>
        
        {/* Additional Filters Row */}
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="registered">Registered</option>
          </select>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-full sm:w-auto truncate rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
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
            className="w-full sm:w-auto rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">All Attendance</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        {/* Mobile view */}
        <div className="block sm:hidden">
          {paginatedData.map((row, index) => (
            <div key={index}>{mobileCard(row)}</div>
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
            columns={columns}
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

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <Dialog
          open={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
        >
          <div className="bg-raisinblack p-6 rounded-lg shadow-lg max-w-md mx-auto w-full h-auto">
            <h2 className="text-light text-lg font-semibold mb-4 text-center">Scan QR for Attendance</h2>
            <QrScannerComponent
              onScan={handleQrScan}
              onError={handleQrError}
            />
            <button
              onClick={() => setShowQrScanner(false)}
              className="mt-4 block w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark"
            >
              Close Scanner
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default RegistrationsTable;
