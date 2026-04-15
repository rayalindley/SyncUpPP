"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import DataTable, { TableColumn } from "react-data-table-component";
import { saveAs } from "file-saver";
import { check_permissions } from "@/lib/organization";
import { Dialog } from "@headlessui/react";
import QrScannerComponent from "@/components/qrscanner";
import { useRouter } from "next/navigation";
import { recordActivity } from "@/lib/track";

interface Registration {
  eventregistrationid: string;
  first_name: string;
  last_name: string;
  email: string;
  event_name: string;
  organization_slug: string;
  id: string;
  registrationdate: string;
  status: string;
  attendance: string | null;
  attendance_updated_at: string;
  has_submitted_feedback: boolean;
  feedback_submitted_at: string;
}

interface RegistrationsTableProps {
  registrations: Registration[];
  userId: string;
  organizationId: string;
}

const RegistrationsTable: React.FC<RegistrationsTableProps> = ({
  registrations,
  userId,
  organizationId,
}) => {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tableData, setTableData] = useState<Registration[]>(registrations);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("");
  const [canManageRegistrations, setCanManageRegistrations] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (searchParams) {
      const eventIdFromQuery = searchParams.get("event");
      if (eventIdFromQuery) {
        setEventFilter(eventIdFromQuery);
      }
    }
  }, [searchParams]);

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

  const uniqueEvents = Array.from(
    new Set(registrations.map((item) => item.id))
  ).map((id) => ({
    id,
    name: registrations.find((item) => item.id === id)?.event_name || "",
  }));

  useEffect(() => {
    setTableData(registrations);
  }, [registrations]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!canManageRegistrations) {
      toast.error("You do not have permission to update the status.");
      return;
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
      const { data: registrationData, error: registrationError } = await supabase
        .from("eventregistrations")
        .select("id, userid")
        .eq("eventregistrationid", id)
        .single<{ id: string; userid: string }>();

      if (registrationError || !registrationData) {
        toast.error("Failed to fetch registration details.");
        return;
      }

      const eventId = registrationData.id;
      const userid = registrationData.userid;

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .or("is_deleted.eq.false,is_deleted.is.null")
        .maybeSingle();

      if (eventError || !eventData) {
        toast.error("Failed to fetch event details.");
        return;
      }

      const { data: userProfile, error: userProfileError } = await supabase
        .from("userprofiles")
        .select("*")
        .eq("userid", userid)
        .single();

      if (userProfileError || !userProfile) {
        toast.error("Failed to fetch user profile.");
        return;
      }

      const { error } = await supabase
        .from("eventregistrations")
        .update({ attendance: newAttendance })
        .eq("eventregistrationid", id);

      if (error) {
        toast.error("Failed to update attendance. Please try again.");
        return;
      }

      toast.success("Attendance updated successfully!");

      const attendanceDescription =
        {
          present: `marked as present`,
          absent: `marked as absent`,
          late: `marked as late`,
        }[newAttendance] || `updated attendance`;

      await recordActivity({
        activity_type: "event_attendance",
        description: `User ${attendanceDescription} for event: ${eventData.title}`,
      });

      await recordActivity({
        activity_type: "event_attendance",
        organization_id: eventData.organizationid,
        description: `User ${userProfile.first_name} ${userProfile.last_name} ${attendanceDescription} for event: ${eventData.title}`,
      });

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

  const exportToCSV = () => {
    const exportData = filteredData.map((item) => ({
      Name: `${item.first_name} ${item.last_name}`,
      Email: item.email,
      "Registration Date": `"${format(
        new Date(item.registrationdate),
        "MMM d, yyyy h:mma"
      )}"`,
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
              ${
                row.status === "pending"
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
              appearance: none;
              background-image: none;
              outline: none;
            }
            select option {
              background-color: #2a2a2a;
              color: #ffffff;
              text-align: center;
              margin: 0;
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
            value={row.attendance || "Set"}
            onChange={(e) =>
              handleAttendanceChange(row.eventregistrationid, e.target.value)
            }
            className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs
              ${
                row.attendance === "present"
                  ? "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:outline-none focus:ring-green-700"
                  : row.attendance === "absent"
                  ? "bg-red-600/25 text-red-300 border-red-700 focus:border-red-700 focus:outline-none focus:ring-red-700"
                  : row.attendance === "late"
                  ? "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                  : "text-light border-[#525252] focus:border-[#525252] focus:outline-none focus:ring-[#525252]"
              }`}
          >
            <option value="Set">Set</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
          <style jsx>{`
            select {
              appearance: none;
              background-image: none;
              outline: none;
            }
            select option {
              background-color: #2a2a2a;
              color: #ffffff;
              text-align: center;
              margin: 0;
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
        if (!row.attendance_updated_at) return "";
        const date = new Date(row.attendance_updated_at);
        if (isNaN(date.getTime()) || date.getTime() === 0) return "";
        const pstDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        return format(pstDate, "MMM d, yyyy h:mma");
      },
    },
    {
      name: "Feedback Submitted At",
      selector: (row: Registration) => row.feedback_submitted_at,
      sortable: true,
      cell: (row: Registration) => {
        if (!row.has_submitted_feedback || !row.feedback_submitted_at) return "";
        const date = new Date(row.feedback_submitted_at);
        if (isNaN(date.getTime()) || date.getTime() === 0) return "";
        const pstDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        return format(pstDate, "MMM d, yyyy h:mma");
      },
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
      (!eventFilter || item.id === eventFilter) &&
      (!attendanceFilter || item.attendance === attendanceFilter)
    );
  });

  const handleQrScan = async (scannedResult: string) => {
    try {
      const url = new URL(scannedResult);
      const scannedUserId = url.searchParams.get("uid");
      const scannedEventId = url.searchParams.get("event");

      if (scannedUserId && scannedEventId) {
        router.push(`/attendance?uid=${scannedUserId}&event=${scannedEventId}`);
      } else {
        toast.error("Invalid QR code.");
      }
    } catch (error) {
      console.error("QR Code processing error:", error);
      toast.error("Failed to process the scanned QR code.");
    }
  };

  const handleQrError = (error: Error) => {
    console.error("QR Scan Error:", error);
  };

  const mobileCard = (row: Registration) => (
    <div className="mt-4 bg-charleston p-4 rounded-lg mb-4 border border-[#525252] relative">
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
          <span className="text-gray-400">Registration Date:</span>{" "}
          <span className="text-white">
            {format(new Date(row.registrationdate), "MMM d, yyyy h:mma")}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Status:</span>{" "}
          <div className="relative inline-block">
            <select
              value={row.status}
              onChange={(e) =>
                handleStatusChange(row.eventregistrationid, e.target.value)
              }
              className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs ml-2
                ${
                  row.status === "pending"
                    ? "bg-yellow-600/25 text-yellow-300 border-yellow-500"
                    : row.status === "registered"
                    ? "bg-green-600/25 text-green-300 border-green-700"
                    : ""
                }`}
            >
              <option value="registered">Registered</option>
              <option value="pending">Pending</option>
            </select>
            <style jsx>{`
              select {
                appearance: none;
                background-image: none;
                outline: none;
              }
              select option {
                background-color: #2a2a2a;
                color: #ffffff;
                text-align: center;
                margin: 0;
              }
            `}</style>
          </div>
        </div>
        <div>
          <span className="text-gray-400">Attendance:</span>{" "}
          <div className="relative inline-block">
            <select
              value={row.attendance || "Set"}
              onChange={(e) =>
                handleAttendanceChange(row.eventregistrationid, e.target.value)
              }
              className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs ml-2
                ${
                  row.attendance === "present"
                    ? "bg-green-600/25 text-green-300 border-green-700"
                    : row.attendance === "absent"
                    ? "bg-red-600/25 text-red-300 border-red-700"
                    : row.attendance === "late"
                    ? "bg-yellow-600/25 text-yellow-300 border-yellow-500"
                    : "text-light border-[#525252]"
                }`}
            >
              <option value="Set">Set</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
            <style jsx>{`
              select {
                appearance: none;
                background-image: none;
                outline: none;
              }
              select option {
                background-color: #2a2a2a;
                color: #ffffff;
                text-align: center;
                margin: 0;
              }
            `}</style>
          </div>
        </div>
        {row.attendance_updated_at &&
          !isNaN(new Date(row.attendance_updated_at).getTime()) &&
          new Date(row.attendance_updated_at).getTime() !== 0 && (
            <div>
              <span className="text-gray-400">Attendance Updated:</span>{" "}
              <span className="text-white">
                {format(
                  new Date(
                    new Date(row.attendance_updated_at).getTime() +
                      8 * 60 * 60 * 1000
                  ),
                  "MMM d, yyyy h:mma"
                )}
              </span>
            </div>
          )}
        {row.has_submitted_feedback &&
          row.feedback_submitted_at &&
          !isNaN(new Date(row.feedback_submitted_at).getTime()) &&
          new Date(row.feedback_submitted_at).getTime() !== 0 && (
            <div>
              <span className="text-gray-400">Feedback Submitted:</span>{" "}
              <span className="text-white">
                {format(
                  new Date(
                    new Date(row.feedback_submitted_at).getTime() +
                      8 * 60 * 60 * 1000
                  ),
                  "MMM d, yyyy h:mma"
                )}
              </span>
            </div>
          )}
      </div>
    </div>
  );

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

  return (
    <>
      <ToastContainer />
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Filters */}
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

            {/* Action Buttons */}
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

          {/* Filter Dropdowns */}
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

        {/* Mobile view */}
        <div className="block sm:hidden">
          {filteredData
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((row, index) => (
              <div key={index}>{mobileCard(row)}</div>
            ))}
          <CustomPagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredData.length / itemsPerPage)}
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </div>

        {/* Desktop view */}
        <div className="hidden sm:block mt-8">
          <DataTable
            columns={columns as TableColumn<Registration>[]}
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
                style: {
                  backgroundColor: "rgb(33, 33, 33)",
                  color: "rgb(255, 255, 255)",
                },
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
            <h2 className="text-light text-lg font-semibold mb-4 text-center">
              Scan QR for Attendance
            </h2>
            <QrScannerComponent onScan={handleQrScan} onError={handleQrError} />
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