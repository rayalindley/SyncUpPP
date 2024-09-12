"use client";
import Preloader from "@/components/preloader";
import { UserProfile } from "@/types/user_profile"; 
import { User } from "@supabase/auth-js/src/lib/types"; 
import { useEffect, useMemo, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { useDebounce } from "use-debounce";
import UserActionButton from "./user_action_button";

interface UserProfileData {
  first_name: string;
  last_name: string;
}

interface UserTableData {
  user: User;
  userProfile: UserProfile | null; // Allow null here
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface UsersTableProps {
  users: User[];
  userProfiles: (UserProfile | null)[];
}

const UsersTable: React.FC<UsersTableProps> = ({ users, userProfiles = [] }) => {
  const [tableData, setTableData] = useState<UserTableData[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);

  useEffect(() => {
    if (users.length && userProfiles.length) {
      const data = userProfiles.map((userProfile, index) => ({
        userProfile,
        user: users[index],
        open: false,
        setOpen: (open: boolean) => {
          setTableData((prevData) => {
            const newData = [...prevData];
            newData[index].open = open;
            return newData;
          });
        },
      }));
      setTableData(data);
    }
  }, [users, userProfiles]);

  const columns: TableColumn<UserTableData>[] = [
    {
      name: "Name",
      selector: (row) =>
        `${row.userProfile?.first_name ?? ""} ${row.userProfile?.last_name ?? ""}`,
      sortable: true,
      cell: (row) => (
        <span
          className="hover:cursor-pointer hover:text-primary"
          onClick={() => row.setOpen(true)}
        >
          {row.userProfile
            ? `${row.userProfile.first_name} ${row.userProfile.last_name}`
            : "Loading..."}
        </span>
      ),
    },
    {
      name: "Email",
      selector: (row) => row.user.email ?? "",
      sortable: true,
    },
    {
      name: "Role",
      selector: (row) => row.user.role ?? "",
      cell: (row) =>
        row.user.role ? (
          row.user.role === "superadmin" ? (
            <span className="border-1 rounded-2xl border border-red-200 bg-red-100 px-2 text-xs text-red-500">
              {row.user.role
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>
          ) : (
            <span className="border-1 rounded-2xl border border-green-400 bg-green-200 px-2 text-xs text-green-800">
              {row.user.role
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>
          )
        ) : (
          "No role"
        ),
      sortable: true,
    },
    {
      name: "Created",
      selector: (row) =>
        row.user.created_at
          ? new Date(row.user.created_at).toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "",
      sortable: true,
    },
    {
      name: "Last Sign In",
      selector: (row) =>
        row.user.last_sign_in_at
          ? new Date(row.user.last_sign_in_at).toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "",
      sortable: true,
    },
    {
      name: "",
      cell: (row) => (
        <UserActionButton
          selectedUser={row.user}
          userProfile={row.userProfile}
          open={row.open}
          setOpen={row.setOpen}
        />
      ),
      button: true,
    },
  ];

  const filteredData = useMemo(
    () =>
      tableData.filter((item) => {
        if (!debouncedFilterText) return true;
        const name = `${item.userProfile?.first_name ?? ""} ${item.userProfile?.last_name ?? ""}`;
        return (
          name.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
          (item.user.email?.toLowerCase().includes(debouncedFilterText.toLowerCase()) ??
            false) ||
          (item.user.role?.toLowerCase().includes(debouncedFilterText.toLowerCase()) ??
            false)
        );
      }),
    [debouncedFilterText, tableData]
  );

  const subHeaderComponent = (
    <input
      type="text"
      placeholder="Search..."
      value={filterText}
      onChange={(e) => setFilterText(e.target.value)}
      className="block rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
    />
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-light">Users</h1>
          <p className="mt-2 text-sm text-light">
            A list of all the users in your account including their name, title, email and
            role.
          </p>
        </div>
      </div>
      <div className="mt-8">
        {tableData.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredData}
            defaultSortFieldId="name"
            pagination
            highlightOnHover
            subHeader
            subHeaderComponent={subHeaderComponent}
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
                  minHeight: "6vh", // override the row height
                  backgroundColor: "rgb(33, 33, 33)",
                  color: "rgb(255, 255, 255)",
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
        ) : (
          <Preloader />
        )}
      </div>
    </div>
  );
};

export default UsersTable;
