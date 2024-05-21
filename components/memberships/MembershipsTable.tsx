"use client";
<<<<<<< HEAD:components/memberships/MembershipsTable.tsx
import { useState } from "react";
import OrganizationOptions from "../app/organization_options";
=======
import { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import OrganizationOptions from "./organization_options";
>>>>>>> 5e3b0f24347089edf1c0bcd652501440a6645bc7:components/app/MembershipsTable.tsx
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
<<<<<<< HEAD:components/memberships/MembershipsTable.tsx
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-[#525252]">
                <thead className="bg-charleston">
                  <tr>
                  {selectedOrgId === "" && (
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light sm:pl-6"
                    >
                      Organization
                    </th>
                  )}

                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Membership
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Fee
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Members
                    </th>
                  
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#525252] bg-raisinblack">
                  {filteredMemberships.map((mem, index) => (
                    <MemRow key={index} 
                            mem={mem} 
                            members={membersByMembershipId[mem.membershipid] || []}
                            showOrg={selectedOrgId === ""}/>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
=======
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
>>>>>>> 5e3b0f24347089edf1c0bcd652501440a6645bc7:components/app/MembershipsTable.tsx
      </div>
    </div>
  );
}
<<<<<<< HEAD:components/memberships/MembershipsTable.tsx

function MemRow({ mem ,members, showOrg }) {
  const [open, setOpen] = useState(false);
  return (
    <tr>
    {showOrg && (
      <td
        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-light sm:pl-6"
        onClick={() => setOpen(!open)}
      >
        <a href="#" className="hover:text-primary" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
          {mem.orgname}
        </a>
      </td>
    )}
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {mem.membershipname}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
      $ {mem.registrationfee.toFixed(2)}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {mem.membership_count}
      </td>

      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <MembershipOptions selectedTier={mem} open={open} setOpen={setOpen}  TierMembers={members}/>
      </td>
    </tr>
  );
}
=======
>>>>>>> 5e3b0f24347089edf1c0bcd652501440a6645bc7:components/app/MembershipsTable.tsx
