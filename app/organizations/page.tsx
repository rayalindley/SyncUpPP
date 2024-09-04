"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import OrganizationCard from "@/components/app/organization_card";
import { createClient, getUser } from "@/lib/supabase/client";
import { Organization } from "@/lib/types"; // Adjust the import path as necessary
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

export default function OrganizationUserView() {
  const [user, setUser] = useState<any>(null); // Adjust the user type based on your actual user structure
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const organizationsPerPage = 6;

  useEffect(() => {
    async function fetchUserAndOrganizations() {
      const { user } = await getUser();
      setUser(user);

      const supabase = createClient();
      const { data: organizations, error } = await supabase
        .from("organization_summary")
        .select("*");

      if (!error) {
        setOrganizations(organizations);
      } else {
        console.error("Error fetching organizations:", error);
      }
    }

    fetchUserAndOrganizations();
  }, []);

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
    <div>
      <Header user={user} />
      <main className="isolate flex flex-col items-center sm:px-4 md:px-6 lg:px-80">
        <div className="relative w-full">
          <div className="mt-4 sm:mt-16 lg:mt-24">
            <h1 className="text-center text-3xl font-bold text-light">Organizations</h1>
            <div className="mt-2 flex items-center justify-center"></div>
            <div className="mt-2 px-4 text-center text-sm text-light sm:px-8 lg:px-10">
              <p>Browse and view organizations that fit your interests.</p>
            </div>

            <div className="min-w-2xl mx-auto mt-20 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {currentOrganizations.map((org) => (
                <OrganizationCard
                  key={org.id}
                  name={org.name}
                  description={org.description}
                  organization_size={org.organization_size}
                  photo={org.photo}
                  slug={org.slug}
                  banner={org.banner}
                  total_members={org.total_members}
                  total_posts={org.total_posts}
                  total_events={org.total_events}
                />
              ))}
            </div>
          </div>
        </div>
        <nav className="mt-8 flex w-full items-center justify-between border-t border-gray-200 px-4 sm:px-0">
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
              <ArrowLongRightIcon
                className="ml-3 h-5 w-5 text-light"
                aria-hidden="true"
              />
            </button>
          </div>
        </nav>
      </main>
      <Footer />
    </div>
  );
}
