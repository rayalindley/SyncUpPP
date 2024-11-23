"use client";
import Preloader from "@/components/preloader";
import { useEffect, useMemo, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import MembershipOptions from "./membership_options";

interface Address {
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  country: string;
}

interface Socials {
  facebook: string;
  twitter: string;
  linkedin: string;
}

interface Member {
  id: number;
  gender: string | null;
  userid: string;
  company: string | null;
  website: string | null;
  last_name: string;
  updatedat: string;
  first_name: string;
  dateofbirth: string | null;
  description: string | null;
  profilepicture: string | null;
}

interface Membership {
  name: string;
  members: Member[];
  features: string[];
  description: string;
  membershipid: string;
  total_members: number;
  cycletype: string;
  registrationfee: number;
  open?: boolean; // Make these properties optional
  setOpen?: (open: boolean) => void; // Make these properties optional
  orgname?: string; // Make these properties optional
}

interface OrganizationMembershipsView {
  organizationid: string;
  name: string;
  description: string;
  adminid: string;
  created_at: string;
  organization_type: string;
  industry: string;
  organization_size: string;
  website: string;
  date_established: string;
  address: Address;
  socials: Socials;
  slug: string;
  photo: string | null;
  banner: string | null;
  memberships: Membership[];
}

interface MembershipsTableProps {
  orgsMemView: OrganizationMembershipsView[];
}

export default function MembershipsTable({ orgsMemView = [] }: MembershipsTableProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [tableData, setTableData] = useState<Membership[]>([]);
  const [filterText, setFilterText] = useState<string>("");

  const organizations = useMemo(() => {
    return orgsMemView.map((org) => ({
      id: org.organizationid,
      name: org.name,
    }));
  }, [orgsMemView]);

  useEffect(() => {
    const filteredOrganizations = selectedOrgId
      ? orgsMemView.filter((org) => org.organizationid === selectedOrgId)
      : orgsMemView;

    const data = filteredOrganizations.flatMap((org) =>
      org.memberships.map((mem) => ({
        ...mem,
        orgname: org.name,
        organizationid: org.organizationid,
        open: mem.open ?? false,
        setOpen:
          mem.setOpen ??
          ((open: boolean) => {
            setTableData((prevData) => {
              const newData = [...prevData];
              const index = newData.findIndex(
                (item) => item.membershipid === mem.membershipid
              );
              if (index !== -1) {
                newData[index] = { ...newData[index], open };
              }
              return newData;
            });
          }),
      }))
    );

    setTableData(data);
  }, [orgsMemView, selectedOrgId]);

  const columns: TableColumn<Membership>[] = [
    {
      name: "Membership",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Organization",
      selector: (row) => row.orgname || "",
      sortable: true,
      omit: selectedOrgId !== "",
    },
    {
      name: "Fee",
      selector: (row) =>
        row.registrationfee !== null && row.registrationfee !== undefined
          ? `$ ${row.registrationfee.toFixed(2)}`
          : "",
      sortable: true,
    },
    {
      name: "Members",
      selector: (row) => row.total_members,
      sortable: true,
    },
    {
      name: "",
      cell: (row) => (
        <MembershipOptions
          selectedTier={row}
          open={row.open ?? false}
          setOpen={row.setOpen ?? (() => {})}
          TierMembers={row.members || []}
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
          item.name.toLowerCase().includes(filterText.toLowerCase()) ||
          (selectedOrgId === "" &&
            item.orgname?.toLowerCase().includes(filterText.toLowerCase()))
        );
      }),
    [filterText, tableData, selectedOrgId]
  );

  const mobileCard = (row: Membership) => (
    <div className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252] relative">
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Membership:</span>{" "}
          <span className="text-white">{row.name}</span>
        </div>
        {!selectedOrgId && (
          <div>
            <span className="text-gray-400">Organization:</span>{" "}
            <span className="text-white">{row.orgname}</span>
          </div>
        )}
        <div>
          <span className="text-gray-400">Fee:</span>{" "}
          <span className="text-white">
            {row.registrationfee !== null && row.registrationfee !== undefined
              ? `$ ${row.registrationfee.toFixed(2)}`
              : "-"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Members:</span>{" "}
          <span className="text-white">{row.total_members}</span>
        </div>
      </div>
      <div className="absolute bottom-4 right-4">
        <MembershipOptions
          selectedTier={row}
          open={row.open ?? false}
          setOpen={row.setOpen ?? (() => {})}
          TierMembers={row.members || []}
        />
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:justify-between">
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-6 text-light">Memberships</h1>
          <p className="mt-2 text-sm text-light">
            A list of all the memberships in your organization
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-[#525252] text-light bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-sm"
          />
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-sm"
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
          <>
            {/* Mobile view */}
            <div className="block sm:hidden">
              {filteredData.map((row, index) => (
                <div key={index}>{mobileCard(row)}</div>
              ))}
            </div>

            {/* Desktop view */}
            <div className="hidden sm:block">
              <DataTable
                columns={columns}
                data={filteredData}
                pagination
                highlightOnHover
                customStyles={{
                  table: { style: { backgroundColor: "rgb(33, 33, 33)" } },
                  headRow: { style: { backgroundColor: "rgb(36, 36, 36)" } },
                  headCells: { style: { color: "rgb(255, 255, 255)" } },
                  rows: {
                    style: { backgroundColor: "rgb(33, 33, 33)", color: "rgb(255, 255, 255)" },
                    highlightOnHoverStyle: {
                      backgroundColor: "rgb(44, 44, 44)",
                      color: "rgb(255, 255, 255)",
                      transitionDuration: "0.15s",
                      transitionProperty: "background-color",
                      zIndex: 1,
                      position: "relative",
                      overflow: "visible",
                    },
                  },
                  pagination: {
                    style: { backgroundColor: "rgb(33, 33, 33)", color: "rgb(255, 255, 255)" },
                  },
                }}
              />
            </div>
          </>
        ) : (
          <Preloader />
        )}
      </div>
    </div>
  );
}
