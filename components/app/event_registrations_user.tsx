"use client";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { TableColumn } from "react-data-table-component";
import { saveAs } from "file-saver";
import { check_permissions } from "@/lib/organization";
import { Dialog } from "@headlessui/react";
import QrScannerComponent from "@/components/qrscanner"; // Import QR Scanner component
import { useRouter } from "next/navigation";
import { recordActivity } from "@/lib/track";

// Dynamically import DataTable
const DataTable = dynamic(() => import("react-data-table-component"), {
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
  userId: string; // Pass userId for permission check
  organizationId: string; // Pass organizationId for permission check
}

const RegistrationsTable: React.FC<RegistrationsTableProps> = ({
  registrations,
  userId,
  organizationId,
}) => {
  const supabase = createClient();
  const router = useRouter();
  const [tableData, setTableData] = useState<Registration[]>(registrations);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("");
  const [canManageRegistrations, setCanManageRegistrations] = useState(false); // State for permissions
  const [showQrScanner, setShowQrScanner] = useState(false); // State for QR scanner modal

  // Check permissions on component mount
  useEffect(() => {
    const checkPermissions = async () => {
      const hasPermission = await check_permissions(
        userId,
        organizationId,
        "manage_event_registrations"
      );
      setCanManageRegistrations(hasPermission);
    };

    checkPermissions();
  }, [userId, organizationId]);

  // Unique events for filter options
  const uniqueEvents = Array.from(
    new Set(registrations.map((item) => item.eventid))
  ).map((id) => ({
    id,
    name: registrations.find((item) => item.eventid === id)?.event_name || "",
  }));

  useEffect(() => {
    setTableData(registrations);
  }, [registrations]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!canManageRegistrations) {
      toast.error("You do not have permission to update the status.");
      return; // Prevent update if no permission
    }

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
      "Registration Date": `"${format(
        new Date(item.registrationdate),
        "MMM d, yyyy h:mma"
      )}"`, // Wrap date in quotes
      Status: item.status,
      Attendance: item.attendance || "Set",
    }));

    const csvContent = [
      ["Name", "Email", "Registration Date", "Status", "Attendance"],
      ...exportData.map((item) => [
        item.Name,
        item.Email,
        item["Registration Date"],
        item.Status,
        item.Attendance,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const event = uniqueEvents.find((e) => e.id === eventFilter);
    const fileName = `${
      event?.name || "event"
    }_registrations_${format(new Date(), "yyyy-MM-dd")}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, fileName);
  };

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

  const columns: TableColumn<Registration>[] = [
    {
      name: "Name",
      selector: (row: Registration) => `${row.first_name} ${row.last_name}`,
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
            className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs focus:border-primary focus:outline-none focus:ring-primary
              ${row.status === "pending"
                ? "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                : row.status === "registered"
                ? "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:outline-none focus:ring-green-700"
                : ""
            }`}
          >
            <option value="registered">Registered</option>
            <option value="pending">Pending</option>
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
            className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1  text-xs 
              ${
                row.attendance === "present"
                  ? "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:outline-none focus:ring-green-700"
                  : row.attendance === "absent"
                  ? "bg-red-600/25 text-red-300 border-red-700  focus:border-red-700 focus:outline-none focus:ring-red-700"
                  : row.attendance === "late"
                  ? "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                  : "text-light border-[#525252] focus:border-[#525252] focus:outline-none focus:ring-[#525252]" // Default for "Set"
              }`}
          >
            <option value="Set">Set</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
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
    <>
      <ToastContainer />
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
          <div className="flex items-center space-x-2">
            {/* Scan QR Button */}
            <button
              onClick={() => setShowQrScanner(true)}
              className="block rounded-md bg-primary text-white px-3 py-2 text-sm shadow-sm hover:bg-primarydark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              Scan QR
            </button>
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
              className="truncate ml-2 block rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              style={{ maxWidth: "200px" }}
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
                style: {
                  backgroundColor: "rgb(33, 33, 33)",
                  color: "rgb(255, 255, 255)",
                },
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
    </>
  );
};

export default RegistrationsTable;
