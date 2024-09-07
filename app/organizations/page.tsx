"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import OrganizationCard from "@/components/app/organization_card";
import { createClient, getUser } from "@/lib/supabase/client";
import { Organization } from "@/types/organization";
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
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-center text-2xl font-bold text-light sm:text-3xl">
            Organizations
          </h1>
          <div className="mt-2 text-center text-sm text-light">
            <p>Browse and view organizations that fit your interests.</p>
          </div>

          <div className="mt-8 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
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
        <nav className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex w-0 flex-1">
            <button
              disabled={isFirstPage}
              onClick={() => paginate(currentPage - 1)}
              className={`inline-flex items-center text-sm font-medium ${
                isFirstPage
                  ? "cursor-not-allowed text-gray-500"
                  : "text-light hover:text-primary"
              }`}
            >
              <ArrowLongLeftIcon className="mr-3 h-5 w-5" aria-hidden="true" />
              Previous
            </button>
          </div>
          <div className="hidden sm:flex">
            {Array.from(
              { length: Math.ceil(organizations.length / organizationsPerPage) },
              (_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`mx-1 inline-flex items-center px-4 py-2 text-sm font-medium ${
                    currentPage === index + 1
                      ? "text-dark bg-primary"
                      : "text-light hover:text-primary"
                  }`}
                >
                  {index + 1}
                </button>
              )
            )}
          </div>
          <div className="flex w-0 flex-1 justify-end">
            <button
              disabled={isLastPage}
              onClick={() => paginate(currentPage + 1)}
              className={`inline-flex items-center text-sm font-medium ${
                isLastPage
                  ? "cursor-not-allowed text-gray-500"
                  : "text-light hover:text-primary"
              }`}
            >
              Next
              <ArrowLongRightIcon className="ml-3 h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </main>
      <Footer />
    </div>
  );
}
