import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Email } from "@/types/email";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const EmailsTable = ({
  emails,
  setEmails,
}: {
  emails: Email[];
  setEmails: (emails: Email[]) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>("date_created");
  const [sortDirection, setSortDirection] = useState<string | null>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showDetailPane, setShowDetailPane] = useState(false);
  const [opacity, setOpacity] = useState(0);

  const emailsPerPage = 10;

  const sortEmails = (emails: Email[], column: string, direction: string) => {
    return emails.sort((a, b) => {
      if (a[column] === null) return 1;
      if (b[column] === null) return -1;
      if (a[column] === b[column]) return 0;
      return direction === "asc"
        ? a[column] > b[column]
          ? 1
          : -1
        : a[column] < b[column]
          ? 1
          : -1;
    });
  };

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = emails.filter((email) =>
      ["sender", "receiver", "subject", "status", "date_created"].some(
        (field) => email[field] && email[field].toString().toLowerCase().includes(search)
      )
    );
    const startIndex = (currentPage - 1) * emailsPerPage;
    setFilteredEmails(filtered.slice(startIndex, startIndex + emailsPerPage));
  }, [emails, searchTerm, currentPage]);

  useEffect(() => {
    if (showDetailPane) {
      setTimeout(() => setOpacity(1), 0);
    } else {
      setOpacity(0);
    }
  }, [showDetailPane]);

  const truncate = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}-${("0" + d.getDate()).slice(-2)}`;
  };

  const handleRowClick = (email: Email) => {
    setSelectedEmail(email);
    setShowDetailPane(true);
  };

  const closeDetailPane = () => {
    setShowDetailPane(false);
  };

  const handleSort = (column: string) => {
    let direction = sortDirection;
    if (sortColumn !== column) {
      direction = "desc";
    } else {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(direction);

    setEmails(sortEmails([...emails], column, direction));
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPageNumbers = () => {
    const pageCount = Math.ceil(emails.length / emailsPerPage);
    if (pageCount <= 1) return null;
    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < pageCount ? currentPage + 1 : null;

    return (
      <div className="flex items-center justify-center space-x-1">
        {prevPage && (
          <button
            className="rounded-full bg-[#505050] p-2 text-white hover:bg-[#404040]"
            onClick={() => handlePageChange(prevPage)}
          >
            {"<"}
          </button>
        )}
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            className={`rounded-full px-3 py-2 text-white hover:bg-[#404040] ${
              currentPage === number ? "bg-[#303030]" : "bg-[#505050]"
            }`}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </button>
        ))}
        {nextPage && (
          <button
            className="rounded-full bg-[#505050] p-2 text-white hover:bg-[#404040]"
            onClick={() => handlePageChange(nextPage)}
          >
            {">"}
          </button>
        )}
      </div>
    );
  };

  const SortIcon = ({ direction }: { direction: string | null }) => {
    return (
      <span style={{ marginLeft: "auto" }}>
        <span className="ml-5"></span>
        {direction === "asc" ? "🡩" : direction === "desc" ? "🡣" : null}
      </span>
    );
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        {emails.length > 0 && (
          <input
            className="mb-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page number
            }}
            aria-label="Search emails"
          />
        )}
        {emails.length > 10 && <div className="my-4">{renderPageNumbers()}</div>}
      </div>
      <div className="overflow-x-auto rounded-lg" style={{ overflow: "auto" }}>
        <table className="w-full text-white" style={{ tableLayout: "fixed" }}>
          <thead className="bg-[#505050]">
            <tr>
              {emails.length > 0 &&
                Object.keys(emails[0]).map(
                  (key) =>
                    key !== "id" &&
                    key !== "body" &&
                    key !== "sender_id" &&
                    key !== "receiver_id" && (
                      <th
                        key={key}
                        className="cursor-pointer border-b border-[#404040] p-3"
                        onClick={() => handleSort(key)}
                        style={{
                          whiteSpace: "nowrap",
                          width: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{capitalizeFirstLetter(key.replace("_", " "))}</span>
                          {sortColumn === key && <SortIcon direction={sortDirection} />}
                        </div>
                      </th>
                    )
                )}
            </tr>
          </thead>
          <tbody className="bg-[#404040]">
            {filteredEmails.map((email, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-[#505050]" : "bg-[#404040]"} cursor-pointer`}
                onClick={() => handleRowClick(email)}
              >
                {Object.entries(email).map(
                  ([key, value]) =>
                    key !== "id" &&
                    key !== "body" &&
                    key !== "sender_id" &&
                    key !== "receiver_id" && (
                      <td
                        key={key}
                        className="border-b border-[#404040] p-3"
                        style={{
                          width: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {key === "date_created"
                          ? formatDate(value)
                          : truncate(value.toString(), 30)}
                      </td>
                    )
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
