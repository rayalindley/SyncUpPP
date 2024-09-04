import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { CombinedUserDataModel } from "@/models/combinedUserDataModel";
import { styled } from "@mui/material/styles";

const StyledDataGrid = styled(DataGrid)({
  "& .MuiDataGrid-root": {
    color: "#fff",
  },
  "& .MuiDataGrid-cell": {
    color: "#fff",
    borderBottom: "1px solid #404040",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#505050",
    borderBottom: "1px solid #404040",
    color: "#000",
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: "bold",
  },
  "& .MuiDataGrid-row": {
    "&:nth-of-type(odd)": {
      backgroundColor: "#505050",
    },
    "&:nth-of-type(even)": {
      backgroundColor: "#404040",
    },
  },
  "& .MuiDataGrid-sortIcon": {
    display: "none",
  },
  "& .MuiTablePagination-root": {
    color: "#fff",
  },
  "& .MuiTablePagination-caption": {
    color: "#fff",
  },
  "& .MuiTablePagination-selectIcon": {
    color: "#fff",
  },
  "& .MuiTablePagination-displayedRows": {
    color: "#fff",
  },
});

const CombinedUserDataTable = ({
  users,
  setUsers,
  toggleSelection,
}: {
  users: CombinedUserDataModel[];
  setUsers: React.Dispatch<React.SetStateAction<CombinedUserDataModel[]>>;
  toggleSelection: (list: CombinedUserDataModel[], id: string) => CombinedUserDataModel[];
}) => {
  const [sortModel, setSortModel] = useState<
    { field: keyof CombinedUserDataModel; sort: "asc" | "desc" }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = users.filter((user) =>
      [
        "firstName",
        "lastName",
        "email",
        "role",
        "gender",
        "description",
        "company",
        "website",
      ].some((field) => {
        const getter = user[
          `get${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof CombinedUserDataModel
        ] as (this: CombinedUserDataModel) => string | Date | undefined;
        if (typeof getter === "function") {
          const value = getter.call(user);
          if (value != null) {
            return value.toString().toLowerCase().includes(search);
          }
        }
        return false;
      })
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const handleSortModelChange = (
    model: { field: keyof CombinedUserDataModel; sort: "asc" | "desc" }[]
  ) => {
    setSortModel(model);
    if (model.length > 0) {
      const { field, sort } = model[0];
      setFilteredUsers(
        [...filteredUsers].sort((a, b) => {
          const aGetter = a[
            `get${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof CombinedUserDataModel
          ] as (this: CombinedUserDataModel) => any;
          const bGetter = b[
            `get${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof CombinedUserDataModel
          ] as (this: CombinedUserDataModel) => any;
          const aValue = typeof aGetter === "function" ? aGetter.call(a) : undefined;
          const bValue = typeof bGetter === "function" ? bGetter.call(b) : undefined;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;
          return sort === "asc" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
        })
      );
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return !isNaN(d.getTime())
      ? `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}-${("0" + d.getDate()).slice(-2)}`
      : "";
  };

  const truncateText = (text: string, maxLength: number) =>
    text?.length > maxLength ? text.slice(0, maxLength) + "..." : text;

  const columns: GridColDef[] = [
    {
      field: "lastName",
      headerName: "Last Name",
      width: 150,
      sortable: true,
      valueGetter: (params: GridRenderCellParams) =>
        params.row ? params.row.lastName ?? "" : "",
    },
    {
      field: "firstName",
      headerName: "First Name",
      width: 150,
      sortable: true,
      valueGetter: (params: GridRenderCellParams) =>
        params.row ? params.row.firstName ?? "" : "",
    },
    {
      field: "email",
      headerName: "Email",
      width: 150,
      sortable: true,
      valueGetter: (params: GridRenderCellParams) =>
        params.row ? params.row.email ?? "" : "",
    },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      sortable: true,
      valueGetter: (params: GridRenderCellParams) =>
        params.row ? params.row.role ?? "" : "",
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 150,
      sortable: true,
      valueFormatter: (params: { value: Date | string | undefined }) =>
        formatDate(params.value),
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 150,
      sortable: true,
      valueFormatter: (params: { value: Date | string | undefined }) =>
        formatDate(params.value),
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 150,
      sortable: true,
      valueGetter: (params: GridRenderCellParams) =>
        params.row ? params.row.gender ?? "" : "",
    },
    {
      field: "dateOfBirth",
      headerName: "Date of Birth",
      width: 150,
      sortable: true,
      valueFormatter: (params: { value: Date | string | undefined }) =>
        formatDate(params.value),
    },
    {
      field: "description",
      headerName: "Description",
      width: 150,
      sortable: true,
      valueFormatter: (params: { value: string }) => truncateText(params.value, 30),
    },
    {
      field: "company",
      headerName: "Company",
      width: 150,
      sortable: true,
      valueFormatter: (params: { value: string }) => truncateText(params.value, 30),
    },
    {
      field: "website",
      headerName: "Website",
      width: 150,
      sortable: true,
      valueFormatter: (params: { value: string }) => truncateText(params.value, 30),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        {users.length > 0 && (
          <input
            className="my-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPaginationModel({ ...paginationModel, page: 0 });
            }}
            aria-label="Search users"
          />
        )}
      </div>
      <div style={{ height: 400, width: "100%" }}>
        <StyledDataGrid
          rows={filteredUsers.map((user) => ({
            id: user.getId(),
            firstName: user.getFirstName(),
            lastName: user.getLastName(),
            email: user.getEmail(),
            role: user.getRole(),
            createdAt: user.getCreatedAt(),
            updatedAt: user.getUpdatedAt(),
            gender: user.getGender(),
            dateOfBirth: user.getDateOfBirth(),
            description: user.getDescription(),
            company: user.getCompany(),
            website: user.getWebsite(),
          }))}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={(model) =>
            handleSortModelChange(
              model as { field: keyof CombinedUserDataModel; sort: "asc" | "desc" }[]
            )
          }
          checkboxSelection
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          slots={{
            columnSortedAscendingIcon: () => <span>🡩</span>,
            columnSortedDescendingIcon: () => <span>🡣</span>,
          }}
        />
      </div>
    </div>
  );
};

export default CombinedUserDataTable;
