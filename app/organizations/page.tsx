"use client";
import OrganizationCard from "@/components/app/organization_card";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { createClient, getUser } from "@/lib/supabase/client";
import { Organization } from "@/types/organization";
import { Menu } from "@headlessui/react";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

const sortOptions = [
  { name: "Most Popular", value: "most-popular" },
  { name: "Number of Events", value: "most-events" },
  { name: "Organization Name A-Z", value: "name-asc" },
  { name: "Organization Name Z-A", value: "name-desc" },
  { name: "Date Established (Newest First)", value: "date-newest" },
  { name: "Date Established (Oldest First)", value: "date-oldest" },
];

const organizationTypeFilters = [
  { name: "All Types", value: "" },
  { name: "Nonprofit", value: "Nonprofit" },
  { name: "For-Profit", value: "For-Profit" },
  { name: "Governmental", value: "Governmental" },
  { name: "Educational", value: "Educational" },
  { name: "Partnership", value: "Partnership" },
  { name: "Corporation", value: "Corporation" },
  { name: "Sole Proprietorship", value: "Sole Proprietorship" },
  { name: "Limited Liability Company (LLC)", value: "Limited Liability Company (LLC)" },
];

const industryFilters = [
  { name: "All Industries", value: "" },
  { name: "Agriculture", value: "Agriculture" },
  { name: "Automotive", value: "Automotive" },
  { name: "Education", value: "Education" },
  { name: "Energy", value: "Energy" },
  { name: "Entertainment", value: "Entertainment" },
  { name: "Finance", value: "Finance" },
  { name: "Healthcare", value: "Healthcare" },
  { name: "Hospitality", value: "Hospitality" },
  { name: "Information Technology", value: "Information Technology" },
  { name: "Manufacturing", value: "Manufacturing" },
  { name: "Retail", value: "Retail" },
  { name: "Telecommunications", value: "Telecommunications" },
  { name: "Transportation", value: "Transportation" },
  { name: "Other", value: "Other" },
];

export default function OrganizationUserView() {
  const [user, setUser] = useState<any>(null); // Adjust the user type based on your actual user structure
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]); // For filtered data
  const [searchTerm, setSearchTerm] = useState("");
  const [organizationTypeFilter, setOrganizationTypeFilter] = useState(""); // Organization Type filter
  const [industryFilter, setIndustryFilter] = useState(""); // Industry filter
  const [sortOption, setSortOption] = useState("most-popular"); // Sort option state
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
    applyFilters(searchValue, organizationTypeFilter, industryFilter);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter organizations based on search, organization type, and industry
  const applyFilters = (searchValue: string, orgType: string, industry: string) => {
    const filtered = organizations.filter((org) => {
      const matchesSearch = org.name.toLowerCase().includes(searchValue);
      const matchesOrgType = orgType === "" || org.organization_type === orgType;
      const matchesIndustry = industry === "" || org.industry === industry;
      return matchesSearch && matchesOrgType && matchesIndustry;
    });
    setFilteredOrganizations(filtered);
  };

  // Handle sorting
  const handleSort = (option: string) => {
    setSortOption(option);
    const sorted = [...filteredOrganizations].sort((a, b) => {
      switch (option) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-newest":
          return (
            new Date(b.date_established).getTime() -
            new Date(a.date_established).getTime()
          );
        case "date-oldest":
          return (
            new Date(a.date_established).getTime() -
            new Date(b.date_established).getTime()
          );
        case "most-popular":
          return b.total_members - a.total_members;
        case "most-events":
          return b.total_events - a.total_events;
        default:
          return 0;
      }
    });
    setFilteredOrganizations(sorted);
  };

  // Handle organization type filter
  const handleOrganizationTypeFilter = (type: string) => {
    setOrganizationTypeFilter(type);
    applyFilters(searchTerm, type, industryFilter);
  };

  // Handle industry filter
  const handleIndustryFilter = (industry: string) => {
    setIndustryFilter(industry);
    applyFilters(searchTerm, organizationTypeFilter, industry);
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
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="isolate flex flex-grow flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="relative w-full max-w-7xl">
          <div className="mt-4 sm:mt-8 md:mt-12 lg:mt-16">
            <h1 className="text-center text-2xl font-bold text-light sm:text-3xl md:text-4xl">
              Organizations
            </h1>
            <div className="mt-2 px-2 text-center text-xs text-light sm:text-sm md:px-4 lg:px-6">
              <p>Browse and view organizations that fit your interests.</p>
            </div>

            {/* Search Input with Sort and Filters */}
            <div className="mx-auto mt-6 flex max-w-3xl justify-between">
              {/* Search Bar */}
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full rounded-lg border border-charleston bg-charleston p-2 pl-10 pr-4 text-sm text-light focus:border-primary focus:ring-primary"
                />
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Sort and Filters */}
              <div className="flex items-center space-x-4 pl-8">
                {/* Sort Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center text-sm font-medium text-light">
                    Sort by
                    <ChevronDownIcon className="ml-1 h-5 w-5" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-44 rounded-md bg-charleston shadow-lg">
                    {sortOptions.map((option) => (
                      <Menu.Item key={option.value}>
                        {({ active }) => (
                          <div
                            onClick={() => handleSort(option.value)}
                            className={`cursor-pointer px-4 py-2 text-sm ${
                              sortOption === option.value
                                ? "bg-primary text-white"
                                : active
                                  ? "bg-[#383838] text-light"
                                  : "text-light"
                            }`}
                          >
                            {option.name}
                          </div>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>

                {/* Organization Type Filter */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center text-sm font-medium text-light">
                    Type
                    <ChevronDownIcon className="ml-1 h-5 w-5" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-52 rounded-md bg-charleston shadow-lg">
                    {organizationTypeFilters.map((option) => (
                      <Menu.Item key={option.value}>
                        {({ active }) => (
                          <div
                            onClick={() => handleOrganizationTypeFilter(option.value)}
                            className={`cursor-pointer px-4 py-2 text-sm ${
                              organizationTypeFilter === option.value
                                ? "bg-primary text-white"
                                : active
                                  ? "bg-[#383838] text-light"
                                  : "text-light"
                            }`}
                          >
                            {option.name}
                          </div>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>

                {/* Industry Filter */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center text-sm font-medium text-light">
                    Industry
                    <ChevronDownIcon className="ml-1 h-5 w-5" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-64 rounded-md bg-charleston shadow-lg">
                    {industryFilters.map((option) => (
                      <Menu.Item key={option.value}>
                        {({ active }) => (
                          <div
                            onClick={() => handleIndustryFilter(option.value)}
                            className={`cursor-pointer px-4 py-2 text-sm ${
                              industryFilter === option.value
                                ? "bg-primary text-white"
                                : active
                                  ? "bg-[#383838] text-light"
                                  : "text-light"
                            }`}
                          >
                            {option.name}
                          </div>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>
              </div>
            </div>

            {/* Organization Cards */}
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

        {/* Pagination */}
              {filteredOrganizations.length > organizationsPerPage && (
                        <nav className="mt-6 flex w-full max-w-7xl items-center justify-between border-t border-gray-200 px-2  sm:mt-8 sm:px-4 md:mt-10">
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
              )}
      </main>
      <Footer />
    </div>
  );
}
