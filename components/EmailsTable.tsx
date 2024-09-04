import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { createPortal } from "react-dom";
import { EmailModel } from "@/models/emailModel"; // Import EmailModel
import { createClient } from "@/lib/supabase/client";
import { styled } from "@mui/material/styles";

const supabase = createClient();

// Styled DataGrid for custom appearance
const StyledDataGrid = styled(DataGrid)({
  '& .MuiDataGrid-root': {
    color: '#fff',
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #404040',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#505050',
    borderBottom: '1px solid #404040',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 'bold',
  },
  '& .MuiDataGrid-row': {
    '&:nth-of-type(odd)': {
      backgroundColor: '#505050',
    },
    '&:nth-of-type(even)': {
      backgroundColor: '#404040',
    },
  },
  '& .MuiDataGrid-sortIcon': {
    display: 'none',
  },
  '& .MuiDataGrid-columnHeader[data-field="sender"] .MuiDataGrid-sortIcon': {
    display: 'block',
  },
  '& .MuiDataGrid-columnHeader[data-field="receiver"] .MuiDataGrid-sortIcon': {
    display: 'block',
  },
  '& .MuiTablePagination-root': {
    color: '#fff', // Change pagination text color to white
  },
});

const EmailsTable = ({
  emails,
  setEmails,
}: {
  emails: EmailModel[]; // Use EmailModel
  setEmails: (emails: EmailModel[]) => void; // Use EmailModel
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredEmails, setFilteredEmails] = useState<EmailModel[]>([]); // Use EmailModel
  const [selectedEmail, setSelectedEmail] = useState<EmailModel | null>(null);
  const [showDetailPane, setShowDetailPane] = useState<boolean>(false);
  const [opacity, setOpacity] = useState<number>(0);
  const emailsPerPage = 10;

  const columns: GridColDef[] = [
    { field: "sender", headerName: "Sender", width: 150 },
    { field: "receiver", headerName: "Receiver", width: 150 },
    { field: "subject", headerName: "Subject", width: 200 },
    { field: "status", headerName: "Status", width: 100 },
    { 
      field: "date_created", 
      headerName: "Date Created", 
      width: 150,
      valueFormatter: (params: { value: string | undefined }) => formatDate(params.value ?? ""),
    },
  ];

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = emails.filter((email) =>
      ["sender", "receiver", "subject", "status", "date_created"].some(
        (field) =>
          email[field as keyof EmailModel] &&
          email[field as keyof EmailModel]!.toString().toLowerCase().includes(search)
      )
    );
    setFilteredEmails(filtered);
  }, [emails, searchTerm]);

  useEffect(() => {
    if (showDetailPane) {
      setTimeout(() => setOpacity(1), 0);
    } else {
      setOpacity(0);
    }
  }, [showDetailPane]);

  const handleRowClick = (email: EmailModel) => {
    setSelectedEmail(email);
    setShowDetailPane(true);
  };

  const closeDetailPane = () => {
    setShowDetailPane(false);
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}-${("0" + d.getDate()).slice(-2)}`;
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {emails.length > 0 && (
          <input
            className="rounded-full border border-gray-300 bg-charleston p-2.5"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search emails"
          />
        )}
      </div>
      <div style={{ height: 400, width: '100%' }}>
        <StyledDataGrid
          rows={filteredEmails}
          columns={columns}
          paginationModel={{ pageSize: emailsPerPage, page: 0 }}
          checkboxSelection
          disableRowSelectionOnClick
          onRowClick={(params) => handleRowClick(params.row as EmailModel)}
          getRowId={(row) => row.id}
          slots={{
            columnSortedAscendingIcon: () => <span>🡩</span>,
            columnSortedDescendingIcon: () => <span>🡣</span>,
          }}
        />
      </div>

      {showDetailPane &&
        selectedEmail &&
        createPortal(
          <div
            className="fixed inset-0 z-10 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              transition: "opacity 0.2s",
              opacity: opacity,
            }}
            onClick={closeDetailPane} // Close the modal when clicking outside
          >
            <div
              className="mt-16 h-[calc(100%-9rem)] w-full max-w-sm space-y-4 overflow-auto rounded-lg bg-charleston p-4 shadow-lg md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
              style={{ color: "white", maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <h3 className="text-2xl font-semibold text-white">Details</h3>
              <table className="mt-4 space-y-4" style={{ width: "100%" }}>
                {Object.entries(selectedEmail)
                  .filter(([key]) => key !== "id" && key !== "sender_id" && key !== "receiver_id")
                  .map(([key, value]) => (
                    <tr key={key}>
                      <td
                        style={{
                          wordWrap: "break-word",
                          width: "30%",
                          paddingBottom: "10px",
                          paddingTop: "10px",
                        }}
                      >
                        <strong>{capitalizeFirstLetter(key.replace("_", " "))}</strong>
                      </td>
                      <td
                        style={{
                          wordWrap: "break-word",
                          width: "70%",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                          paddingBottom: "10px",
                          paddingTop: "10px",
                        }}
                      >
                        {key === "body" ? (
                          <div dangerouslySetInnerHTML={{ __html: String(value) }} />
                        ) : (
                          <div>{String(value)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
              </table>
              <button
                onClick={closeDetailPane}
                className="float-right mt-2 rounded bg-primary px-4 py-2 text-white"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default EmailsTable;
