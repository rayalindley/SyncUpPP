"use client";
import OrganizationCard from "@/components/app/organization_card";
import { Organization } from "@/types/organization";
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { useState } from "react";

const UserOrganizations = ({ organizations }: { organizations: Organization[] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const organizationsPerPage = 3;

  // Calculate the indices for the current page's organizations
  const indexOfLastOrganization = currentPage * organizationsPerPage;
  const indexOfFirstOrganization = indexOfLastOrganization - organizationsPerPage;
  const currentOrganizations = organizations.slice(
    indexOfFirstOrganization,
    indexOfLastOrganization
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Determine if the current page is the first or the last
  const isFirstPage = currentPage === 1;
  const isLastPage = indexOfLastOrganization >= organizations.length;

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <p className="mt-2 text-2xl font-bold tracking-tight text-light sm:text-2xl">
          My Organizations
        </p>
      </div>
      <div className="isolate mx-auto mt-8 grid max-w-lg grid-cols-1 gap-x-5 gap-y-8 text-left sm:mt-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {currentOrganizations.map((organization) => (
          <OrganizationCard
            key={organization.id}
            name={organization.name}
            description={organization.description}
            organization_size={organization.organization_size}
            photo={organization.photo}
            banner={organization.banner}
            slug={organization.slug}
            total_members={organization.total_members}
            total_posts={organization.total_posts}
            total_events={organization.total_events}
          />
        ))}
      </div>
      <nav className="mt-8 flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
        <div className="-mt-px flex w-0 flex-1">
          <button
            disabled={isFirstPage}
            onClick={() => paginate(currentPage - 1)}
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
        <div className="-mt-px flex w-0 flex-1 justify-end">
          <button
            disabled={isLastPage}
            onClick={() => paginate(currentPage + 1)}
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
};

export default UserOrganizations;
