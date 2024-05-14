"use client";
import { useState } from "react";
import OrganizationOptions from "./organization_options";
import MembershipOptions from "./membership_options";
import { Listbox } from "@headlessui/react"; 

interface Membership {
  organizationid: string;
  orgname: string;
}

export default function MembershipsTable({ orgmems }: { orgmems: Membership[] }) {
  const [selectedOrgId, setSelectedOrgId] = useState("");

  // Extract unique organizations
  const organizations = Array.from(
    new Set(orgmems.map((mem: Membership) => mem.organizationid))
  ).map((id) => {
    const found = orgmems.find((mem) => mem.organizationid === id);
    return { id: found?.organizationid, name: found?.orgname };
  });

  const filteredMemberships = orgmems.filter(
    (mem) => mem.organizationid === selectedOrgId || selectedOrgId === ""
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
        <div className=" relative mt-2 sm:mt-0">
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="appearance-none block w-full px-3 py-2 text-base font-normal text-light bg-raisinblack border border-solid border-gray-500 rounded-full transition ease-in-out focus:border-emerald-500 focus:bg-charleston focus:text-light focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-emerald-500 pr-8"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id} >
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>
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
                      Type
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
                      Description
                    </th>
                  
                    {/* <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Most Popular
                    </th> */}
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#525252] bg-raisinblack">
                  {filteredMemberships.map((mem, index) => (
                    <MemRow key={index} mem={mem} showOrg={selectedOrgId === ""}/>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemRow({ mem , showOrg }) {
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
        {mem.registrationfee}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {mem.description}
      </td>

      {/* <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {mem.mostPopular ? "TRUE" : "FALSE"}
      </td> */}

      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <MembershipOptions selectedTier={mem} open={open} setOpen={setOpen} />
      </td>
    </tr>
  );
}
