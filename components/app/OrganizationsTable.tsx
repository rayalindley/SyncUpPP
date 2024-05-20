"use client";
import { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import OrganizationOptions from "./organization_options";

export default function OrganizationsTable({ organizations }) {
  const [tableData, setTableData] = useState([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    const data = organizations.map((org, index) => ({
      ...org,
      open: false,
      setOpen: (open) => {
        setTableData((prevData) => {
          const newData = [...prevData];
          newData[index].open = open;
          return newData;
        });
      },
    }));
    setTableData(data);
  }, [organizations]);

  const columns = [
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <a href="#" className="hover:text-primary" onClick={() => row.setOpen(!row.open)}>
          {row.name}
        </a>
      ),
    },
    {
      name: "Type",
      selector: (row) => row.organization_type,
      sortable: true,
    },
    {
      name: "Industry",
      selector: (row) => row.industry,
      sortable: true,
    },
    {
      name: "Size",
      selector: (row) => row.organization_size,
      sortable: true,
    },
    {
      name: "Date Established",
      selector: (row) =>
        row.date_established
          ? new Date(row.date_established).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
      sortable: true,
    },
    {
      name: "Created at",
      selector: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleString("en-US", {
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
        <OrganizationOptions selectedOrg={row} open={row.open} setOpen={row.setOpen} />
      ),
      button: true,
    },
  ];

  const filteredData = useMemo(
    () =>
      tableData.filter((item) => {
        if (!filterText) return true;
        return (
          item.name.toLowerCase().includes(filterText.toLowerCase()) ||
          item.organization_type.toLowerCase().includes(filterText.toLowerCase()) ||
          item.industry.toLowerCase().includes(filterText.toLowerCase())
        );
      }),
    [filterText, tableData]
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
          <h1 className="text-base font-semibold leading-6 text-light">Organizations</h1>
          <p className="mt-2 text-sm text-light">
            A list of all the organizations in your account including their name, type,
            industry, size, and dates.
          </p>
        </div>
      </div>
      <div className="mt-8">
        {tableData.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredData}
            defaultSortField="name"
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
                  minHeight: "6vh",
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
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
