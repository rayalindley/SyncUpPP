import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Email } from "@/lib/types";

const EmailsTable = ({
  emails,
  setEmails,
}: {
  emails: Email[];
  setEmails: (emails: Email[]) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmails, setFilteredEmails] = useState(emails.slice(0, 10));
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showDetailPane, setShowDetailPane] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Sort by date in descending order only on the initial load
    if (sortColumn === null && sortDirection === null) {
      const sortedEmails = emails.sort((a, b) => {
        const dateA = new Date(a.date_created).getTime();
        const dateB = new Date(b.date_created).getTime();
        return dateB - dateA;
      });
      setEmails(sortedEmails);
    }
  }, [emails]);

  // This effect will run when the component mounts and whenever the emails change
  useEffect(() => {
    // If sortColumn and sortDirection are not null, sort the emails
    if (sortColumn && sortDirection) {
      const sortedEmails = [...emails].sort((a, b) => {
        // Custom sorting logic based on sortColumn and sortDirection
        // For example, if sorting by date:
        const valueA = new Date(a[sortColumn]).getTime();
        const valueB = new Date(b[sortColumn]).getTime();
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      });
      setEmails(sortedEmails);
    }
  }, [emails, sortColumn, sortDirection, setEmails]);

  useEffect(() => {
    if (showDetailPane) {
      setTimeout(() => setOpacity(1), 0);
    } else {
      setOpacity(0);
    }
  }, [showDetailPane]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}-${d.getDate()}`;
  };

  const formatKey = (key: string) => {
    const keyMap: { [key: string]: string } = {
      body: "Body",
      sender: "Sender",
      receiver: "Receiver",
      subject: "Subject",
      status: "Status",
      date_created: "Date Created",
    };
    return keyMap[key] || key;
  };

  const checkIfExcludedKey = (key: string) => {
    const excludedKeys = ["id", "Body"];
    return excludedKeys.includes(key) ? null : key;
  };

  const emailsPerPage = 10;

  const handleRowClick = (email: Email) => {
    setSelectedEmail(email);
    setShowDetailPane(true);
  };

  const closeDetailPane = () => {
    setShowDetailPane(false);
  };

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = emails.filter((email) =>
      ["body", "sender", "receiver", "subject", "status", "Date Created"].some(
        (field) => email[field] && email[field].toString().toLowerCase().includes(search)
      )
    );

    const startIndex = (currentPage - 1) * emailsPerPage;
    const paginatedEvents = filtered.slice(startIndex, startIndex + emailsPerPage);
    setFilteredEmails(paginatedEvents);
  }, [emails, searchTerm, currentPage]);

  const SortIcon = ({ direction }: { direction: string | null }) => {
    return (
      <span style={{ marginLeft: "auto" }}>
        <span className=" ml-5"></span>
        {direction === "asc" ? "🡩" : direction === "desc" ? "🡣" : null}
      </span>
    );
  };

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = emails.filter((email) =>
      Object.values(email).some(
        (value) =>
          value === null ||
          value === undefined ||
          value.toString().toLowerCase().includes(search)
      )
    );
    const startIndex = (currentPage - 1) * emailsPerPage;
    setFilteredEmails(filtered.slice(startIndex, startIndex + emailsPerPage));
  }, [emails, searchTerm, currentPage]);

  const handleSort = (column: string) => {
    let direction = sortDirection;
    if (sortColumn !== column) {
      direction = "asc";
    } else {
      direction = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(direction);

    const sortedEmails = [...emails].sort((a, b) => {
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

    setEmails(sortedEmails);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPageNumbers = () => {
    const search = searchTerm.toLowerCase();
    const filtered = emails.filter((email) =>
      Object.values(email).some(
        (value) =>
          value === null ||
          value === undefined ||
          value.toString().toLowerCase().includes(search)
      )
    );
    const pageCount = Math.ceil(filtered.length / emailsPerPage);
    if (pageCount <= 1) {
      return null;
    }
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

  return (
    <>
      <div className="flex items-center justify-between">
        {emails.length > 0 && (
          <input
            className="my-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
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
                Object.keys(emails[0]).map((key) => {
                  const formattedKey = checkIfExcludedKey(formatKey(key));
                  return (
                    formattedKey && (
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
                          <span>{formattedKey}</span>
                          {sortColumn === key && <SortIcon direction={sortDirection} />}
                        </div>
                      </th>
                    )
                  );
                })}
            </tr>
          </thead>
          <tbody className="bg-[#404040]">
            {filteredEmails.map((email, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-[#505050]" : "bg-[#404040]"} ${"cursor-pointer"}`}
                onClick={() => handleRowClick(email)}
              >
                {Object.entries(email).map(([key, value]) => {
                  const formattedKey = checkIfExcludedKey(formatKey(key));
                  let displayValue = value || "";
                  if (key === "date_created" && value) {
                    displayValue = formatDate(value);
                  }
                  return (
                    formattedKey && (
                      <td
                        key={`${email.id}-${key}`}
                        className="border-b border-[#404040] p-3"
                        style={{
                          width: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {displayValue}
                      </td>
                    )
                  );
                })}
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
              transition: "opacity 0.5s",
              opacity: opacity,
            }}
          >
            <div
              className="w-full max-w-sm space-y-4 overflow-auto rounded-lg bg-charleston p-4 shadow-lg md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
              style={{ color: "white", maxHeight: "90vh" }}
            >
              <h3 className="text-2xl font-semibold text-white">Details</h3>
              <table className="mt-4 space-y-4" style={{ width: "100%" }}>
                {Object.entries(selectedEmail)
                  .filter(([key]) => key !== "id")
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
                        <strong>{formatKey(key)}</strong>
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
    </>
  );
};

export default EmailsTable;
