"use client";
import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "use-debounce";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

const supabase = createClient();

interface OrganizationRequest {
  id: number;
  status: string;
  created_at: string;
  org_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface RequestsTableProps {
  requests: OrganizationRequest[];
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

const RequestsTable: React.FC<RequestsTableProps> = ({ requests }) => {
  const [tableData, setTableData] = useState<OrganizationRequest[]>(requests);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    setTableData(requests);
  }, [requests]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from("organization_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status. Please try again.");
    } else {
      toast.success("Status updated successfully!");
      setTableData((prevData) =>
        prevData.map((request) =>
          request.id === id ? { ...request, status: newStatus } : request
        )
      );
    }
  };

  const handleAcceptAll = async () => {
    const { error } = await supabase
      .from("organization_requests")
      .update({ status: "approved" })
      .eq("status", "pending");

    if (error) {
      toast.error("Failed to accept all pending requests. Please try again.");
    } else {
      toast.success("All pending requests accepted successfully!");
      setTableData((prevData) =>
        prevData.map((request) =>
          request.status === "pending" ? { ...request, status: "approved" } : request
        )
      );
    }
  };

  const columns = [
    {
      name: "Name",
      selector: (row: OrganizationRequest) => `${row.first_name} ${row.last_name}`,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row: OrganizationRequest) => row.email,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: OrganizationRequest) => row.status,
      sortable: true,
      cell: (row: OrganizationRequest) => (
        <div className="relative">
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className={`text-center bg-charleston cursor-pointer rounded-2xl border-2 px-4 py-1  text-xs 
            ${row.status === "pending"
                ? "bg-yellow-600/25 text-yellow-300 border-yellow-500 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                : row.status === "approved"
                  ? "bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:outline-none focus:ring-green-700"
                  : "bg-red-600/25 text-red-300 border-red-700  focus:border-red-700 focus:outline-none focus:ring-red-700"
            }`}
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
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
      name: "Requested At",
      selector: (row: OrganizationRequest) => row.created_at,
      sortable: true,
      cell: (row: OrganizationRequest) =>
        format(new Date(row.created_at), "MMM d, yyyy h:mma"),
    },
  ];

  const filteredData = tableData.filter((item) => {
    if (!debouncedFilterText && !statusFilter) return true;
    const name = `${item.first_name} ${item.last_name}`;
    return (
      (name.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
        item.email.toLowerCase().includes(debouncedFilterText.toLowerCase())) &&
      (!statusFilter || item.status === statusFilter)
    );
  });

  const mobileCard = (row: OrganizationRequest) => (
    <div className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252]">
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
          <span className="text-gray-400">Status:</span>{" "}
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className={`mt-1 text-center cursor-pointer rounded-2xl border-2 px-4 py-1 text-xs w-full sm:w-auto
              ${row.status === "pending"
                ? "bg-yellow-600/25 text-yellow-300 border-yellow-500"
                : row.status === "approved"
                  ? "bg-green-600/25 text-green-300 border-green-700"
                  : "bg-red-600/25 text-red-300 border-red-700"
              }`}
            style={{ backgroundColor: 'transparent' }}
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <span className="text-gray-400">Requested At:</span>{" "}
          <span className="text-white">
            {format(new Date(row.created_at), "MMM d, yyyy h:mma")}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:justify-between">
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-6 text-light">
            Organization Requests
          </h1>
          <p className="mt-2 text-sm text-light">
            A list of all the requests to join this organization.
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-[#525252] text-light bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={handleAcceptAll}
            className="w-full sm:w-auto rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primarydark"
          >
            Accept All
          </button>
        </div>
      </div>

      <div className="mt-8">
        {/* Mobile view */}
        <div className="block sm:hidden">
          {filteredData.map((row) => (
            <div key={row.id}>{mobileCard(row)}</div>
          ))}
          <CustomPagination 
            currentPage={1} // Replace with actual pagination state if needed
            totalPages={Math.ceil(filteredData.length / 10)} // Adjust per your needs
            onPageChange={(page: number) => {/* Handle page change */}}
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
              cells: {
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
};

export default RequestsTable;
