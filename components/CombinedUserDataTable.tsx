import React, { useState, useEffect } from "react";
import { CombinedUserData } from "@/lib/types";

const CombinedUserDataTable = ({
  users,
  setUsers,
  toggleSelection,
}: {
  users: CombinedUserData[];
  setUsers: React.Dispatch<React.SetStateAction<CombinedUserData[]>>;
  toggleSelection: (list: CombinedUserData[], id: string) => CombinedUserData[];
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof CombinedUserData | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    if (!sortColumn && !sortDirection) {
      setUsers((prevUsers) =>
        [...prevUsers].sort((a, b) =>
          (a.first_name ?? "").localeCompare(b.first_name ?? "")
        )
      );
    }
  }, [sortColumn, sortDirection, setUsers]);

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const startIndex = (currentPage - 1) * usersPerPage;
    const filtered = users
      .filter((user) =>
        [
          "first_name",
          "last_name",
          "email",
          "role",
          "gender",
          "description",
          "company",
          "website",
        ].some(
          (field) =>
            user[field as keyof CombinedUserData] &&
            user[field as keyof CombinedUserData]
              ?.toString()
              .toLowerCase()
              .includes(search)
        )
      )
      .slice(startIndex, startIndex + usersPerPage);

    setFilteredUsers(filtered);
  }, [searchTerm, users, currentPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(e.target.checked);
    setUsers(users.map((user) => ({ ...user, selected: e.target.checked })));
  };

  const handleSelectRow = (id: string) => {
    setUsers(toggleSelection(users, id));
  };

  const handleSort = (column: keyof CombinedUserData) => {
    const direction =
      sortColumn !== column ? "asc" : sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(direction);
    setFilteredUsers(
      [...filteredUsers].sort((a, b) => {
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

  const SortIcon = ({ direction }: { direction: "asc" | "desc" | null }) => (
    <span style={{ marginLeft: "auto" }}>
      {direction === "asc" ? "🡩" : direction === "desc" ? "🡣" : null}
    </span>
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPageNumbers = () => {
    const search = searchTerm.toLowerCase();
    const filtered = users.filter((user) =>
      Object.values(user).some(
        (value) =>
          value === null ||
          value === undefined ||
          value.toString().toLowerCase().includes(search)
      )
    );
    const pageCount = Math.ceil(filtered.length / usersPerPage);
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
        {users.length > 0 && (
          <input
            className="my-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page number
            }}
            aria-label="Search users"
          />
        )}
        {users.length > usersPerPage && <div className="my-4">{renderPageNumbers()}</div>}
      </div>
      <div className="overflow-x-auto rounded-lg">
        {filteredUsers.length > 0 ? (
          <table className="min-w-full text-white" style={{ tableLayout: "fixed" }}>
            <thead className="bg-[#505050]">
              <tr>
                <th style={{ width: "30px" }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    aria-label="Select all users"
                  />
                </th>
                {[
                  { key: "last_name", title: "Last Name" },
                  { key: "first_name", title: "First Name" },
                  { key: "email", title: "Email" },
                  { key: "role", title: "Role" },
                  { key: "created_at", title: "Created At" },
                  { key: "updated_at", title: "Updated At" },
                  { key: "gender", title: "Gender" },
                  { key: "dateofbirth", title: "Date of Birth" },
                  { key: "description", title: "Description" },
                  { key: "company", title: "Company" },
                  { key: "website", title: "Website" },
                ].map(({ key, title }) => (
                  <th
                    key={key}
                    className="cursor-pointer border-b border-[#404040] p-3 text-left"
                    onClick={() => handleSort(key as keyof CombinedUserData)}
                    style={{
                      whiteSpace: "nowrap",
                      minWidth: "150px",
                      maxWidth: "150px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <div className="flex items-center justify-start">
                      {title}
                      {sortColumn === key && <SortIcon direction={sortDirection} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[#404040]">
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`${index % 2 === 0 ? "bg-[#505050]" : "bg-[#404040]"} cursor-pointer`}
                  onClick={() => handleSelectRow(user.id || "")}
                >
                  <td className="border-b border-[#404040] p-3">
                    <input
                      type="checkbox"
                      checked={user.selected || false}
                      onChange={() => handleSelectRow(user.id || "")}
                      aria-label={`Select ${user.first_name}`}
                    />
                  </td>
                  <td className="border-b border-[#404040] p-3">{user.last_name}</td>
                  <td className="border-b border-[#404040] p-3">{user.first_name}</td>
                  <td className="border-b border-[#404040] p-3">{user.email}</td>
                  <td className="border-b border-[#404040] p-3">{user.role}</td>
                  <td className="border-b border-[#404040] p-3">
                    {formatDate(user.created_at ?? "")}
                  </td>
                  <td className="border-b border-[#404040] p-3">
                    {formatDate(user.created_at ?? "")}
                  </td>
                  <td className="border-b border-[#404040] p-3">{user.gender}</td>
                  <td className="border-b border-[#404040] p-3">
                    {formatDate(user.created_at ?? "")}
                  </td>
                  <td className="border-b border-[#404040] p-3">{user.description}</td>
                  <td className="border-b border-[#404040] p-3">{user.company}</td>
                  <td className="border-b border-[#404040] p-3">{user.website}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </>
  );
};

export default CombinedUserDataTable;
