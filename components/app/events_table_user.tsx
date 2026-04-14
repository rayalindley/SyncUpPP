"use client";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import EventOptions from "./event_options";
import { TableColumn } from "react-data-table-component";
import { useDebounce } from "use-debounce";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const supabase = createClient();

const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});

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

const STATUS_STYLES: Record<
  string,
  { color: string; borderColor: string; backgroundColor: string }
> = {
  open: {
    color: "#86efac",
    borderColor: "#15803d",
    backgroundColor: "rgba(22, 163, 74, 0.25)",
  },
  ongoing: {
    color: "#fde047",
    borderColor: "#eab308",
    backgroundColor: "rgba(202, 138, 4, 0.25)",
  },
  closed: {
    color: "#fca5a5",
    borderColor: "#b91c1c",
    backgroundColor: "rgba(220, 38, 38, 0.25)",
  },
};

const STATUS_OPTIONS = [
  { value: "Open", label: "Open" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Closed", label: "Closed" },
];

function getStatusStyle(value: string) {
  return STATUS_STYLES[value?.toLowerCase()] ?? STATUS_STYLES["open"];
}

// ✅ Client-side permission check — calls Supabase RPC directly from the browser
async function checkPermissionClient(
  userId: string,
  orgId: string,
  permKey: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_org_permissions", {
      p_user_id: userId,
      p_org_id: orgId,
      p_perm_key: permKey,
    });

    if (error) {
      console.error("Error checking permissions (client):", error);
      return false;
    }

    return !!data;
  } catch (e) {
    console.error("Unexpected error in checkPermissionClient:", e);
    return false;
  }
}

function StatusDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const style = getStatusStyle(value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={dropdownRef}
      className="relative inline-block"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          color: style.color,
          borderColor: style.borderColor,
          backgroundColor: style.backgroundColor,
        }}
        className="flex items-center gap-1 rounded-2xl border-2 px-3 py-1 text-xs cursor-pointer"
      >
        {STATUS_OPTIONS.find(
          (o) => o.value.toLowerCase() === value?.toLowerCase()
        )?.label ?? "Open"}
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            top: dropdownRef.current
              ? dropdownRef.current.getBoundingClientRect().bottom + 4
              : 0,
            left: dropdownRef.current
              ? dropdownRef.current.getBoundingClientRect().left
              : 0,
            width: "8rem",
            backgroundColor: "#1e1e1e",
            border: "1px solid #525252",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            overflow: "hidden",
          }}
        >
          {STATUS_OPTIONS.map((option) => {
            const optStyle = getStatusStyle(option.value);
            const isActive =
              option.value.toLowerCase() === value?.toLowerCase();
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{
                  color: optStyle.color,
                  backgroundColor: isActive
                    ? optStyle.backgroundColor
                    : "transparent",
                  borderLeft: `3px solid ${optStyle.borderColor}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    optStyle.backgroundColor;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "transparent";
                  }
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

export default function EventsTableUser({
  organization,
  events,
  userId,
  orgSlug,
}: {
  organization: Organization;
  events: Event[];
  userId: string;
  orgSlug: string;
}) {
  const router = useRouter();

  const [canCreateEvents, setCanCreateEvents] = useState<boolean>(false);
  const [canEditEvents, setCanEditEvents] = useState<boolean>(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);

  const [tableData, setTableData] = useState<Event[]>(events);
  useEffect(() => {
    setTableData(events);
  }, [events]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Use client-side RPC directly instead of server action
  useEffect(() => {
    let cancelled = false;

    const checkPermissions = async () => {
      try {
        const [createPerm, editPerm] = await Promise.all([
          checkPermissionClient(userId, organization.organizationid, "create_events"),
          checkPermissionClient(userId, organization.organizationid, "edit_events"),
        ]);
        if (!cancelled) {
          setCanCreateEvents(createPerm);
          setCanEditEvents(editPerm);
          setPermissionsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to check permissions", error);
        if (!cancelled) {
          setCanCreateEvents(false);
          setCanEditEvents(false);
          setPermissionsLoaded(true);
        }
      }
    };

    checkPermissions();

    return () => {
      cancelled = true;
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
        .eq("id", id)
        .or("is_deleted.eq.false,is_deleted.is.null");

      if (error) {
        toast.error("Failed to update status. Please try again.");
      } else {
        toast.success("Status updated successfully!");
        setTableData((prev) =>
          prev.map((event) =>
            event.id === id
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
        cell: (row) =>
          row.starteventdatetime ? fmtDate(row.starteventdatetime) : "—",
      },
      {
        name: "End Date & Time",
        selector: (row) => row.endeventdatetime ?? "",
        sortable: true,
        cell: (row) =>
          row.endeventdatetime ? fmtDate(row.endeventdatetime) : "—",
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
            <StatusDropdown
              value={row.status ?? "Open"}
              onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
            />
          ) : (
            <span
              style={getStatusStyle(row.status ?? "open")}
              className="rounded-2xl border-2 px-3 py-1 text-xs"
            >
              {row.status ?? "Open"}
            </span>
          ),
      },
      {
        name: "",
        cell: (row) => (
          <EventOptions
            selectedEvent={row}
            userId={userId}
            orgSlug={orgSlug}
          />
        ),
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
      },
    ],
    [canEditEvents, handleStatusChange, userId, orgSlug]
  );

  const filteredData = useMemo(
    () =>
      debouncedFilterText
        ? tableData.filter((event) =>
            event.title
              .toLowerCase()
              .includes(debouncedFilterText.toLowerCase())
          )
        : tableData,
    [debouncedFilterText, tableData]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // ✅ FIX: Removed absolute positioning for Options button,
  // placed Status and Options in the same flex row
  const renderMobileCard = useCallback(
    (row: Event) => (
      <div className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252]">
        <div className="space-y-2">
          {(
            [
              ["Title", row.title],
              [
                "Start Date & Time",
                row.starteventdatetime
                  ? fmtDate(row.starteventdatetime)
                  : "—",
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

          {/* Status and Options on the same row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Status:</span>
              {canEditEvents ? (
                <StatusDropdown
                  value={row.status ?? "Open"}
                  onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
                />
              ) : (
                <span
                  style={getStatusStyle(row.status ?? "open")}
                  className="rounded-2xl border-2 px-3 py-1 text-xs"
                >
                  {row.status ?? "Open"}
                </span>
              )}
            </div>

            <EventOptions
              selectedEvent={row}
              userId={userId}
              orgSlug={orgSlug}
            />
          </div>
        </div>
      </div>
    ),
    [canEditEvents, handleStatusChange, userId, orgSlug]
  );

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

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 rounded-md border border-[#525252] bg-charleston px-3 py-2 text-light shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-sm"
          />
          {!permissionsLoaded ? (
            <div className="w-full sm:w-28 h-10 rounded-md bg-gray-700 animate-pulse" />
          ) : (
            canCreateEvents && (
              <button
                onClick={handleCreateEvent}
                className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primarydark"
              >
                Create Event
              </button>
            )
          )}
        </div>

        <div className="block sm:hidden">
          {paginatedData.map((row) => (
            <div key={row.id}>{renderMobileCard(row)}</div>
          ))}
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

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
                  overflow: "visible",
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
                  overflow: "visible",
                },
              },
              pagination: {
                style: {
                  backgroundColor: "rgb(33, 33, 33)",
                  color: "rgb(255, 255, 255)",
                },
              },
              tableWrapper: {
                style: {
                  overflow: "visible",
                },
              },
              responsiveWrapper: {
                style: {
                  overflow: "visible",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}