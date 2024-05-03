"use client";
import { useState } from "react";
import OrganizationOptions from "./organization_options";

export default function OrganizationsTable({ organizations }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-light">Organizations</h1>
          <p className="mt-2 text-sm text-light">
            A list of all the users in your account including their name, title, email and
            role.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none"></div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-[#525252]">
                <thead className="bg-charleston">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light sm:pl-6"
                    >
                      Name
                    </th>

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
                      Industry
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Date Established
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Created at
                    </th>

                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#525252] bg-raisinblack">
                  {organizations.map((org, index) => (
                    <OrganizationRow key={index} org={org} />
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

function OrganizationRow({ org }) {
  const [open, setOpen] = useState(false);
  return (
    <tr key={org.organizationid}>
      <td
        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-light sm:pl-6"
        onClick={() => setOpen(!open)}
      >
        <a href="#" className="hover:text-primary" onClick={() => setOpen(!open)}>
          {org.name}
        </a>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {org.organization_type}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">{org.industry}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {org.organization_size}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {org.date_established
          ? new Date(org.date_established).toLocaleString("en-US", {
              weekday: "long", // "Monday"
              year: "numeric", // "2024"
              month: "long", // "April"
              day: "numeric", // "16"
            })
          : ""}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {org.created_at
          ? new Date(org.created_at).toLocaleString("en-US", {
              weekday: "long", // "Monday"
              year: "numeric", // "2024"
              month: "long", // "April"
              day: "numeric", // "16"
              hour: "numeric", // "1"
              minute: "2-digit", // "40"
            })
          : ""}
      </td>

      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <OrganizationOptions selectedOrg={org} open={open} setOpen={setOpen} />
      </td>
    </tr>
  );
}
