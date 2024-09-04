import { Organizations } from "@/types/organizations";
import React, { useState, useEffect } from "react";

const formatTitle = (title: string) =>
  title.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const OrganizationsTable = ({
  organizations,
  setOrganizations,
  toggleSelection,
}: {
  organizations: Organizations[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organizations[]>>;
  toggleSelection: (list: Organizations[], id: string) => Organizations[];
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof Organizations | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrganizations, setFilteredOrganizations] = useState(organizations);

  const [currentPage, setCurrentPage] = useState(1); // Add this line

  useEffect(() => {
    if (!sortColumn && !sortDirection) {
      setOrganizations((prevOrgs) =>
        [...prevOrgs].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
  }, [sortColumn, sortDirection]);

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const startIndex = (currentPage - 1) * organizationsPerPage;
    const filtered = organizations
      .filter((org) =>
        [
          "name",
          "description",
          "organization_type",
          "industry",
          "organization_size",
          "website",
        ].some(
          (field) =>
            org[field as keyof Organizations] !== undefined &&
            org[field as keyof Organizations]?.toString().toLowerCase().includes(search)
        )
      )
      .slice(startIndex, startIndex + organizationsPerPage);

    setFilteredOrganizations(filtered);
  }, [organizations, searchTerm, currentPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked);
    setOrganizations(
      organizations.map((org) => ({ ...org, selected: e.target.checked }))
    );
  };

  const handleSelectRow = (id: string) => {
    setOrganizations(toggleSelection(organizations, id));
  };

  const handleSort = (column: keyof Organizations) => {
    const direction =
      sortColumn !== column ? "asc" : sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(direction);
    setFilteredOrganizations(
      [...filteredOrganizations].sort((a, b) => {
        if (a[column] === undefined) return 1;
        if (b[column] === undefined) return -1;
        return direction === "asc"
          ? (a[column] ?? "") > (b[column] ?? "")
            ? 1
            : -1
          : (a[column] ?? "") < (b[column] ?? "")
            ? 1
            : -1;
      })
    );
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}-${d.getDate()}`;
  };

  const SortIcon = ({ direction }: { direction: string | null }) => (
    <span style={{ marginLeft: "auto" }}>
      {direction === "asc" ? "🡩" : direction === "desc" ? "🡣" : null}
    </span>
  );

  // Add the following functions for handling page changes and rendering page numbers
  const organizationsPerPage = 10;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPageNumbers = () => {
    const search = searchTerm.toLowerCase();
    const filtered = organizations.filter((org) =>
      Object.values(org).some(
        (value) =>
          value === null ||
          value === undefined ||
          value.toString().toLowerCase().includes(search)
      )
    );
    const pageCount = Math.ceil(filtered.length / organizationsPerPage);
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
        {organizations.length > 0 && (
          <input
            className="my-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page number
            }}
            aria-label="Search organizations"
          />
        )}
        {organizations.length > organizationsPerPage && (
          <div className="my-4">{renderPageNumbers()}</div>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg">
        {filteredOrganizations.length > 0 ? (
          <table className="min-w-full text-white" style={{ tableLayout: "fixed" }}>
            <thead className="bg-[#505050]">
              <tr>
                <th style={{ width: "30px" }}>
                  <input
                    aria-label="Select all organizations"
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                {Object.keys(filteredOrganizations[0])
                  .filter(
                    (key) =>
                      !["organizationid", "adminid", "slug", "selected", "id"].includes(
                        key
                      )
                  )
                  .map((key) => (
                    <th
                      key={key}
                      className="cursor-pointer border-b border-[#404040] p-3 text-left"
                      onClick={() => handleSort(key as keyof Organizations)}
                      style={{
                        whiteSpace: "nowrap",
                        minWidth: "150px",
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <div className="flex items-center justify-start">
                        {formatTitle(key)}
                        {sortColumn === key && <SortIcon direction={sortDirection} />}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-[#404040]">
              {filteredOrganizations.map((org, index) => (
                <tr
                  key={org.organizationid}
                  className={`${index % 2 === 0 ? "bg-[#505050]" : "bg-[#404040]"} cursor-pointer`}
                  onClick={() => handleSelectRow(org.organizationid)}
                >
                  <td className="border-b border-[#404040] p-3">
                    <input
                      aria-label="Select organization"
                      type="checkbox"
                      checked={org.selected || false}
                      onChange={() => handleSelectRow(org.organizationid)}
                    />
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {org.name}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {org.description}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {formatDate(org.created_at as string)}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {org.organization_type}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {org.industry}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {org.organization_size}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {org.website}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {formatDate(org.date_established as string)}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {`${org.address?.city}, ${org.address?.state ? org.address?.state + ", " : ""}${org.address?.country}`}
                  </td>
                  <td
                    className="border-b border-[#404040] p-3"
                    style={{ width: "150px" }}
                  >
                    {org.socials && Object.values(org.socials).filter(Boolean).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No organizations found.</p>
        )}
      </div>
    </>
  );
};

export default OrganizationsTable;
