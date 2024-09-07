"use client";
import OrganizationCard from "@/components/app/organization_card";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { createClient, getUser } from "@/lib/supabase/client";
import { Organization } from "@/types/organization";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

export default function OrganizationUserView() {
  const [user, setUser] = useState<any>(null); // Adjust the user type based on your actual user structure
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]); // For filtered data
  const [searchTerm, setSearchTerm] = useState("");
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
        setFilteredOrganizations(organizations); // Initialize with all organizations
      } else {
        console.error("Error fetching organizations:", error);
      }
    }

    fetchUserAndOrganizations();
  }, []);

  // Handle search input
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);
    const filtered = organizations.filter((org) =>
      org.name.toLowerCase().includes(searchValue)
    );
    setFilteredOrganizations(filtered);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Calculate the current organizations to display
  const indexOfLastOrganization = currentPage * organizationsPerPage;
  const indexOfFirstOrganization = indexOfLastOrganization - organizationsPerPage;
  const currentOrganizations = filteredOrganizations.slice(
    indexOfFirstOrganization,
    indexOfLastOrganization
  );

  // Pagination handlers
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const isFirstPage = currentPage === 1;
  const isLastPage = indexOfLastOrganization >= filteredOrganizations.length;

  return (
    <div>
      <Header user={user} />
      <main className="isolate flex flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="relative w-full max-w-7xl">
          <div className="mt-4 sm:mt-8 md:mt-12 lg:mt-16">
            <h1 className="text-center text-2xl font-bold text-light sm:text-3xl md:text-4xl">
              Organizations
            </h1>
            <div className="mt-2 px-2 text-center text-xs text-light sm:text-sm md:px-4 lg:px-6">
              <p>Browse and view organizations that fit your interests.</p>
            </div>

            {/* Search Input with Heroicons Magnifying Glass */}
            <div className="relative mt-4 flex w-full justify-center sm:mt-6">
              <div className="relative w-full max-w-xl">
                <input
                  type="text"
                  placeholder="Search organizations by name"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full rounded-md border border-charleston bg-charleston px-3 py-2 pl-10 pr-3 text-xs text-light focus:border-primary focus:ring-primary sm:text-sm"
                />
                {/* Search Icon */}
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid w-full grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 md:mt-10 md:gap-6 lg:grid-cols-3 xl:gap-8">
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
        <nav className="mt-6 flex w-full max-w-7xl items-center justify-between border-t border-gray-200 px-2 pt-4 sm:mt-8 sm:px-4 md:mt-10">
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
              { length: Math.ceil(filteredOrganizations.length / organizationsPerPage) },
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
