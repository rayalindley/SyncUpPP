"use client";
import { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import OrganizationOptions from "./organization_options";
import MembershipOptions from "./membership_options";

export default function MembershipsTable({ orgmems, allMembers }) {
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [tableData, setTableData] = useState([]);
  const [filterText, setFilterText] = useState("");

  const organizations = useMemo(() => {
    return Array.from(new Set(orgmems.map((mem) => mem.organizationid))).map((id) => {
      const found = orgmems.find((mem) => mem.organizationid === id);
      return { id: found?.organizationid, name: found?.orgname };
    });
  }, [orgmems]);

  useEffect(() => {
    const filteredMemberships = orgmems.filter(
      (mem) => mem.organizationid === selectedOrgId || selectedOrgId === ""
    );

    const filteredMembers = allMembers.filter(
      (member) => member.organizationid === selectedOrgId || selectedOrgId === ""
    );

    const membersByMembershipId = {};
    filteredMembers.forEach((member) => {
      if (!membersByMembershipId[member.membershipid]) {
        membersByMembershipId[member.membershipid] = [];
      }
      membersByMembershipId[member.membershipid].push(member);
    });

    const data = filteredMemberships.map((mem) => ({
      ...mem,
      members: membersByMembershipId[mem.membershipid] || [],
      open: false,
      setOpen: (open) => {
        setTableData((prevData) => {
          const newData = [...prevData];
          const index = newData.findIndex(
            (item) => item.membershipid === mem.membershipid
          );
          newData[index].open = open;
          return newData;
        });
      },
    }));

    setTableData(data);
  }, [orgmems, allMembers, selectedOrgId]);

  const columns = [
    {
      name: "Membership",
      selector: (row) => row.membershipname,
      sortable: true,
    },
    {
      name: "Organization",
      selector: (row) => row.orgname,
      sortable: true,
      omit: selectedOrgId !== "",
    },
    {
      name: "Fee",
      selector: (row) => `$ ${row.registrationfee.toFixed(2)}`,
      sortable: true,
    },
    {
      name: "Members",
      selector: (row) => row.membership_count,
      sortable: true,
    },
    {
      name: "",
      cell: (row) => (
        <MembershipOptions
          selectedTier={row}
          open={row.open}
          setOpen={row.setOpen}
          TierMembers={row.members}
        />
      ),
      button: true,
    },
  ];

  const filteredData = useMemo(
    () =>
      tableData.filter((item) => {
        if (!filterText) return true;
        return (
          item.membershipname.toLowerCase().includes(filterText.toLowerCase()) ||
          (selectedOrgId === "" &&
            item.orgname.toLowerCase().includes(filterText.toLowerCase()))
        );
      }),
    [filterText, tableData, selectedOrgId]
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
          <h1 className="text-base font-semibold leading-6 text-light">Memberships</h1>
          <p className="mt-2 text-sm text-light">
            A list of all the memberships in your organization
          </p>
        </div>
        <div className="relative mt-2 sm:mt-0">
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="block w-full appearance-none rounded-full border border-solid border-gray-500 bg-raisinblack px-3 py-2 pr-8 text-base font-normal text-light transition ease-in-out hover:border-emerald-500 focus:border-emerald-500 focus:bg-charleston focus:text-light focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-8">
        {tableData.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredData}
            defaultSortField="membershipname"
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
