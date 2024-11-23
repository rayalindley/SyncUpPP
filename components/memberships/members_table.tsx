"use client";
import Preloader from "@/components/preloader";
import { Organization } from "@/types/organization";
import { useEffect, useMemo, useState } from "react";
import dynamic from 'next/dynamic';
import { useDebounce } from "use-debounce";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import Swal from 'sweetalert2';
import { createClient, getUser } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { TableColumn, TableProps } from "react-data-table-component";
import ActivityFeed from "@/components/activity_feed";
import { Activity } from "@/types/activities";
import { recordActivity, isActiveMember } from "@/lib/track";
import { check_permissions } from "@/lib/organization";
import DataTable from "react-data-table-component";

const supabase = createClient();

interface OrganizationMember {
  organizationmemberid: string;
  organizationid: string;
  userid: string;
  membershipid: string | null;
  roleid: string;
  joindate: string;
  enddate: string | null;
  months: number;
  expiration_date: string | null;
  organization_slug: string;
  organization: any;
  user: {
    gender: string;
    userid: string;
    company: string;
    website: string;
    last_name: string;
    updatedat: string;
    first_name: string;
    dateofbirth: string | null;
    description: string;
    profilepicture: string;
  };
  membership: {
    name: string | null;
    features: any | null;
    description: string | null;
    membershipid: string | null;
    cycletype: string;
    registrationfee: number | null;
  };
  role: {
    role: string;
    color: string;
    roleid: string;
    editable: boolean;
    deletable: boolean;
  };
  payments?: {
    type: string;
    amount: number;
    status: string;
    invoiceId: string;
    paymentId: string;
    created_at: string;
    invoiceUrl: string;
  }[];
}

interface MemberTableData extends OrganizationMember {
  open: boolean;
  setOpen: (open: boolean) => void;
  status: 'Active' | 'Inactive';
}

interface MembersTableProps {
  members: OrganizationMember[];
  organization: Organization;
}

const MembersTable: React.FC<MembersTableProps> = ({ members, organization }) => {
  const [tableData, setTableData] = useState<MemberTableData[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberTableData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const [userActivities, setUserActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Fetch the current user's ID
    const fetchUserData = async () => {
      const { user } = await getUser();
      setUserId(user?.id ?? null);
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchMemberStatus = async () => {
      setIsMounted(true);
      if (members.length) {
        const data = await Promise.all(members.map(async (member) => {
          const isActive = await isActiveMember(member.userid, member.organizationid);
          return {
            ...member,
            status: isActive ? 'Active' : 'Inactive',
            open: false,
            setOpen: (open: boolean) => {
              setTableData((prevData) =>
                prevData.map((item) =>
                  item.organizationmemberid === member.organizationmemberid
                    ? { ...item, open }
                    : item
                )
              );
            },
          };
        }));
        setTableData(data as MemberTableData[]);
      }
    };

    fetchMemberStatus();
  }, [members]);

  useEffect(() => {
    if (selectedMember) {
      fetchUserActivities(selectedMember.userid);
    }
  }, [selectedMember]);

  const fetchUserActivities = async (userId: string) => {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .is('organization_id', null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching user activities:", error);
    } else {
      setUserActivities(data || []);
    }
  };

  const columns: TableColumn<MemberTableData>[] = [
    {
      name: "Name",
      selector: (row: MemberTableData) => `${row.user.first_name} ${row.user.last_name}`,
      sortable: true,
    },
    {
      name: "Role",
      selector: (row: MemberTableData) => row.role.role,
      sortable: true,
      cell: (row: MemberTableData) => (
        <span className={`border-2 rounded-2xl px-4 py-1 text-xs`} style={{ borderColor: row.role.color, backgroundColor: `${row.role.color}33`, color: row.role.color }}>
          {row.role.role}
        </span>
      ),
    },
    {
      name: "Join Date",
      selector: (row: MemberTableData) => row.joindate,
      sortable: true,
      cell: (row: MemberTableData) => new Date(row.joindate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }),
    },
    {
      name: "Membership",
      selector: (row: MemberTableData) => row.membership.name ?? "N/A",
      sortable: true,
    },
    {
      name: "Status",
      selector: (row: MemberTableData) => row.status,
      sortable: true,
      cell: (row: MemberTableData) => (
        <span className={`w-20 text-center bg-charleston cursor-pointer rounded-2xl border-2 px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-primar ${
          row.status === 'Active' ? 'bg-green-600/25 text-green-300 border-green-700 focus:border-green-700 focus:outline-none focus:ring-green-700' : 'bg-red-600/25 text-red-300 border-red-700  focus:border-red-700 focus:outline-none focus:ring-red-700'
        }`}>
          {row.status}
        </span>
      ),
    },
  ] as TableColumn<MemberTableData>[];

  const handleRowClick = (row: MemberTableData) => {
    setSelectedMember(row);
  };

  const filteredData = useMemo(
    () =>
      tableData.filter((item) => {
        if (!debouncedFilterText) return true;
        const name = `${item.user.first_name} ${item.user.last_name}`;
        return (
          name.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
          item.role.role.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
          (item.membership.name?.toLowerCase().includes(debouncedFilterText.toLowerCase()) ?? false)
        );
      }),
    [debouncedFilterText, tableData]
  );

  const mobileCard = (row: MemberTableData) => (
    <div 
      onClick={(e) => handleRowClick(row)}
      className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252] relative cursor-pointer hover:bg-opacity-80 transition-colors duration-200"
    >
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Name:</span>{" "}
          <span className="text-white">{`${row.user.first_name} ${row.user.last_name}`}</span>
        </div>
        <div>
          <span className="text-gray-400">Role:</span>{" "}
          <span className={`inline-block border-2 rounded-2xl px-4 py-1 text-xs`} 
            style={{ 
              borderColor: row.role.color, 
              backgroundColor: `${row.role.color}33`, 
              color: row.role.color 
            }}>
            {row.role.role}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Join Date:</span>{" "}
          <span className="text-white">
            {new Date(row.joindate).toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Membership:</span>{" "}
          <span className="text-white">{row.membership.name ?? "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-400">Status:</span>{" "}
          <span className={`inline-block w-20 text-center rounded-2xl border-2 px-2 py-1 text-xs ${
            row.status === 'Active' 
              ? 'bg-green-600/25 text-green-300 border-green-700' 
              : 'bg-red-600/25 text-red-300 border-red-700'
          }`}>
            {row.status}
          </span>
        </div>
      </div>
    </div>
  );

  const CustomPagination = ({ currentPage, totalPages, onPageChange }: any) => (
    <div className="flex items-center justify-between px-4 py-3 bg-charleston sm:hidden rounded-lg">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-eerieblack rounded-md hover:bg-opacity-80 disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-300">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-eerieblack rounded-md hover:bg-opacity-80 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );

  const handleRemoveMember = async (organizationMemberId: string, userIdToRemove: string, role: string) => {
    const { user } = await getUser(); // Get the currently logged-in user

    // Check if the member is the owner or the current user
    if (role === 'Owner') {
      Swal.fire({
        title: "Failed!",
        text: "You can't remove a member with the Owner role.",
        icon: "error",
      });
      return;
    }

    if (user?.id === userIdToRemove) {
      Swal.fire({
        title: "Failed!",
        text: "You can't remove your own account.",
        icon: "error",
      });
      return;
    }

    // Check if the user has the 'remove_member' permission
    const hasPermission = await check_permissions(
      user?.id || "",
      organization.organizationid,
      "remove_member"
    );

    if (!hasPermission) {
      Swal.fire({
        title: "Failed!",
        text: "You do not have the permission to remove members.",
        icon: "error",
      });
      return;
    }

    // Show a confirmation dialog
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove member!'
    });

    if (confirmResult.isConfirmed) {
      try {
        // Call Supabase to remove the member
        const { error } = await supabase
          .from('organizationmembers')
          .delete()
          .eq('organizationid', organization.organizationid)
          .eq('userid', userIdToRemove);

        if (error) {
          throw new Error(error.message);
        }

        // Fetch user's first and last name
        const { data: userData, error: userError } = await supabase
          .from('userprofiles')
          .select('first_name, last_name')
          .eq('userid', userIdToRemove)
          .single();

        if (userError) {
          throw new Error(userError.message);
        }

        // Record Activity
        await recordActivity({
          activity_type: "member_remove",
          description: `${user?.user_metadata?.first_name} has removed the member: ${userData.first_name} ${userData.last_name}.`,
          organization_id: organization.organizationid,
          activity_details: {
            member_id: userIdToRemove,
          },
        });

        Swal.fire(
          'Removed!',
          'The member has been removed from the organization.',
          'success'
        );

        // Update the table data
        setTableData(prevData => prevData.filter(member => member.userid !== userIdToRemove));
        setSelectedMember(null);

        // Refresh the page to get updated data from the server
        router.refresh();
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: 'There was an error removing the member: ' + (error as Error).message,
          icon: 'error'
        });
      }
    }
  };

  if (!isMounted) {
    return <Preloader />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-light">
            {organization.name} Members
          </h1>
          <p className="mt-2 text-sm text-light">
            A list of all the members in {organization.name} including their name, role,
            join date, and membership details.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full sm:w-auto rounded-md border border-[#525252] bg-charleston px-3 py-2 text-light shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-sm"
        />
        {/* Add additional filters here if needed */}
      </div>

      <div className="mt-8">
        {tableData.length > 0 ? (
          <>
            {/* Mobile view */}
            <div className="block sm:hidden space-y-4">
              {filteredData.map((row, index) => (
                <div key={index}>{mobileCard(row)}</div>
              ))}
              <CustomPagination 
                currentPage={1} // Replace with actual pagination state
                totalPages={Math.ceil(filteredData.length / 10)} // Adjust per your needs
                onPageChange={(page: number) => {/* Handle page change */}}
              />
            </div>

            {/* Desktop view */}
            <div className="hidden sm:block">
              <DataTable<MemberTableData>
                columns={columns}
                data={filteredData}
                pagination
                highlightOnHover
                subHeader
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
                onRowClicked={handleRowClick}
                pointerOnHover
              />
            </div>
          </>
        ) : (
          <Preloader />
        )}
      </div>

      <Transition.Root show={!!selectedMember} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setSelectedMember(null)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-eerieblack py-6 shadow-xl">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-xl font-semibold leading-6 text-light">
                            Member Details
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md text-gray-400 hover:text-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              onClick={() => setSelectedMember(null)}
                            >
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        {selectedMember && (
                          <div className="space-y-6">
                            <div className="rounded-lg bg-charleston p-4">
                              <h3 className="mb-2 text-lg font-medium text-light">
                                Personal Information
                              </h3>
                              <div className="space-y-2 text-gray-300">
                                <p>
                                  <span className="font-semibold">Name:</span>{" "}
                                  {selectedMember.user.first_name}{" "}
                                  {selectedMember.user.last_name}
                                </p>
                                <p>
                                  <span className="font-semibold">Gender:</span>{" "}
                                  {selectedMember.user.gender}
                                </p>
                                <p>
                                  <span className="font-semibold">Date of Birth:</span>{" "}
                                  {selectedMember.user.dateofbirth || "N/A"}
                                </p>
                                <p>
                                  <span className="font-semibold">Company:</span>{" "}
                                  {selectedMember.user.company}
                                </p>
                                <p>
                                  <span className="font-semibold">Website:</span>{" "}
                                  {selectedMember.user.website}
                                </p>
                                <p>
                                  <span className="font-semibold">Description:</span>{" "}
                                  {selectedMember.user.description}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-lg bg-charleston p-4">
                              <h3 className="mb-2 text-lg font-medium text-light">
                                Organization Details
                              </h3>
                              <div className="space-y-2 text-gray-300">
                                <p>
                                  <span className="font-semibold">Role:</span>{" "}
                                  {selectedMember.role.role}
                                </p>
                                <p>
                                  <span className="font-semibold">Join Date:</span>{" "}
                                  {new Date(selectedMember.joindate).toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "numeric",
                                      hour12: true,
                                    }
                                  )}
                                </p>
                                <p>
                                  <span className="font-semibold">Months:</span>{" "}
                                  {selectedMember.months}
                                </p>
                                <p>
                                  <span className="font-semibold">End Date:</span>{" "}
                                  {selectedMember.enddate
                                    ? new Date(selectedMember.enddate).toLocaleString(
                                        "en-US",
                                        {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "numeric",
                                          minute: "numeric",
                                          hour12: true,
                                        }
                                      )
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-lg bg-charleston p-4">
                              <h3 className="mb-2 text-lg font-medium text-light">
                                Membership Information
                              </h3>
                              {selectedMember.membership.name ? (
                                <div className="rounded-lg  p-3">
                                  <h3 className="text-xl font-semibold text-light">
                                    {selectedMember.membership.name}
                                  </h3>
                                  <p className="mt-2 text-gray-400">
                                    {selectedMember.membership.description}
                                  </p>
                                  <hr className="my-4 border-gray-600" />
                                  <div className="mt-4 space-y-2">
                                    <div className="flex justify-between">
                                      <span className="font-semibold text-gray-300">
                                        Cycle:
                                      </span>
                                      <span className="text-light">
                                        {selectedMember.membership.cycletype.charAt(0).toUpperCase() + selectedMember.membership.cycletype.slice(1)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-semibold text-gray-300">
                                        Registration Fee:
                                      </span>
                                      <span className="text-light">
                                        ₱{selectedMember.membership.registrationfee}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-semibold text-gray-300">
                                        Expiration Date:
                                      </span>
                                      <span className="text-light">
                                        {selectedMember.expiration_date
                                          ? new Date(
                                              selectedMember.expiration_date
                                            ).toLocaleString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                              hour: "numeric",
                                              minute: "numeric",
                                              hour12: true,
                                            })
                                          : "No Expiration"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-300">No Membership</p>
                              )}
                            </div>
                            <div className="rounded-lg bg-charleston p-4">
                              <h3 className="mb-4 text-lg font-medium text-light">
                                Payment History
                              </h3>
                              {selectedMember.payments &&
                              selectedMember.payments.length > 0 ? (
                                <div className="space-y-4">
                                  {selectedMember.payments.map((payment) => (
                                    <a
                                      key={payment.paymentId}
                                      href={payment.invoiceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block rounded-lg bg-eerieblack p-4 transition-colors duration-200 hover:bg-opacity-80"
                                    >
                                      <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-300">
                                          {payment.invoiceId}
                                        </span>
                                        <span
                                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                                            payment.status === "COMPLETED"
                                              ? "bg-green-800 text-green-200"
                                              : "bg-yellow-800 text-yellow-200"
                                          }`}
                                        >
                                          {payment.status}
                                        </span>
                                      </div>
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="text-lg font-bold text-light">
                                          ${payment.amount}
                                        </span>
                                        <span className="text-sm capitalize text-gray-400">
                                          {payment.type}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {new Date(payment.created_at).toLocaleString(
                                          "en-US",
                                          {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "numeric",
                                            minute: "numeric",
                                            hour12: true,
                                          }
                                        )}
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-300">
                                  No payment history available
                                </p>
                              )}
                            </div>
                            <div className="rounded-lg bg-charleston p-4">
                              <h3 className="mb-4 text-lg font-medium text-light">
                                User Activities
                              </h3>
                              {userActivities.length > 0 ? (
                                <ActivityFeed activities={userActivities} />
                              ) : (
                                <p className="text-gray-300">No activities available</p>
                              )}
                            </div>
                            <div className="mt-6">
                              <button
                                onClick={() =>
                                  handleRemoveMember(
                                    selectedMember.organizationmemberid,
                                    selectedMember.userid,
                                    selectedMember.role.role
                                  )
                                }
                                className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                Remove Member
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default MembersTable;
