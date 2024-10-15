"use client";
import { ArrowLongLeftIcon, ArrowLongRightIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import OrganizationCard from "../app/organization_card";
import { Organizations } from "@/types/organizations";

interface OrgSummary extends Organizations {
  total_members: number;
  total_posts: number;
  total_events: number;
}

interface OrganizationSectionProps {
  organizations: OrgSummary[];
}


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function OrganizationSection({ organizations }: OrganizationSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const organizationsPerPage = 8;

  // Calculate the current organizations to display
  const indexOfLastOrganization = currentPage * organizationsPerPage;
  const indexOfFirstOrganization = indexOfLastOrganization - organizationsPerPage;
  const currentOrganizations = organizations.slice(
    indexOfFirstOrganization,
    indexOfLastOrganization
  );

  // Pagination handlers
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const isFirstPage = currentPage === 1;
  const isLastPage = indexOfLastOrganization >= organizations.length;

  return (
    <div className="mt-10">
      <h3 className="mt-5 text-base font-semibold leading-6 text-gray-300">
        Organizations
      </h3>
      <div className="isolate mx-auto mt-5 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-2xl xl:mx-0 xl:max-w-none xl:grid-cols-4">
        {currentOrganizations.length === 0 ? (
          <p className="text-light">No organizations found.</p>
        ) : (
          currentOrganizations.map((org, index) => (
            <OrganizationCard
              key={index}
              name={org.name ?? ""}
              description={org.description ?? ""}
              organization_size={org.organization_size ?? 0}
              photo={org.photo ?? ""}
              slug={org.slug ?? ""}
              banner={org.banner ?? ""}
              total_members={org.total_members}
              total_posts={org.total_posts}
              total_events={org.total_events}
            />
          ))
        )}

        {/* Buttons to create and search organization */}
        <div className="flex h-full min-h-[350px] w-full flex-col space-y-4  rounded-lg">
          <a
            href="/organization/create"
            className="flex flex-1 flex-col items-center justify-center rounded-md border-2 border-dashed border-charleston px-4 py-6 text-sm font-medium text-gray-600  text-light transition duration-150 ease-in-out hover:bg-charleston focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <svg
              className="mb-2 h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Create Organization
          </a>
          <a
            href="/organizations"
            className="flex flex-1 flex-col items-center justify-center rounded-md  border-2 border-dashed border-charleston px-4 py-6 text-sm font-medium text-light transition duration-150 ease-in-out hover:bg-charleston focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <svg
              className="mb-2 h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Find Organizations
          </a>
        </div>
      </div>

      {/* Pagination */}
      <nav className="mt-8 flex w-full items-center justify-between border-t border-gray-200 px-4 sm:px-0">
        {/* Previous button */}
        <div className="-mt-px flex w-0 flex-1">
          <button
            disabled={isFirstPage}
            onClick={() => setCurrentPage(currentPage - 1)}
            className={`inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium ${
              isFirstPage
                ? "cursor-not-allowed text-gray-500"
                : "text-light hover:border-primary hover:text-primary"
            }`}
          >
            <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-light" aria-hidden="true" />
            Previous
          </button>
        </div>
        {/* Page numbers */}
        <div className="hidden md:-mt-px md:flex">
          {Array.from(
            { length: Math.ceil(organizations.length / organizationsPerPage) },
            (_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium ${
                  currentPage === index + 1
                    ? "border-primarydark text-primary"
                    : "text-light hover:border-primary hover:text-primary"
                }`}
              >
                {index + 1}
              </button>
            )
          )}
        </div>
        {/* Next button */}
        <div className="-mt-px flex w-0 flex-1 justify-end">
          <button
            disabled={isLastPage}
            onClick={() => setCurrentPage(currentPage + 1)}
            className={`inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium ${
              isLastPage
                ? "cursor-not-allowed text-gray-500"
                : "text-light hover:border-primary hover:text-primary"
            }`}
          >
            Next
            <ArrowLongRightIcon className="ml-3 h-5 w-5 text-light" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
}
