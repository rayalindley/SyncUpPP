"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MembershipModal from "./create_membership_modal";
import MembershipCard from "./membership_card"; // Adjust the import path as needed
import Swal from 'sweetalert2';
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { RadioGroup } from "@headlessui/react";
import { monthsToQuarters } from "date-fns";
// Initialize Supabase client
const supabase = createClient();

const frequencies = [
  { value: 'monthly', label: 'Monthly', priceSuffix: '/month' },
  { value: 'annually', label: 'Annually', priceSuffix: '/year' },
];
export { frequencies };

const MembershipTiers = ({ memberships, userid, onCreateClick }) => {
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(undefined);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [frequency, setFrequency] = useState(frequencies[0]);

  const handleEditMembership = (membership, organizationId) => {
    setSelectedMembership(membership);
    setSelectedOrganizationId(organizationId);
    setShowModal(true);
  };

  useEffect(() => {
    if (userid) {
      fetchUserMemberships();
    }
  }, [userid]);

  const fetchUserMemberships = async () => {
    try {
      const { data: userMembershipsData, error } = await supabase
        .from("organizationmembers")
        .select("membershipid")
        .eq("userid", userid);

      if (error) {
        console.error("Error fetching user memberships: ", error);
        toast.error("Error fetching user memberships. Please try again later.");
        return;
      }

      // Extract membership IDs from data
      const userMemberships =
        userMembershipsData?.map((membership) => membership.membershipid) || [];
      setUserMemberships(userMemberships);
    } catch (error) {
      console.error("Error: ", error);
      toast.error("An error occurred. Please try again later.");
    }
  };



  const handleBuyPlan = useCallback(
    async (membershipId, organizationId) => {
      try {
        if (userMemberships.includes(membershipId)) {
          // If user already has the membership, notify and return
          toast.warning("You already have this membership.");
          return;
        }

        const months = frequency.value === 'monthly' ? 12 : 1;
        console.log("months", months)

        const { data: rolesData, error: rolesError } = await supabase
          .from("organization_roles")
          .select("role_id")
          .eq("org_id", organizationId)
          .eq("role", "User")
          .single();

        if (rolesError) {
          console.error("Error fetching role ID: ", rolesError);
          return;
        }

        const defaultRoleId = rolesData?.role_id;

        const { data, error } = await supabase.from("organizationmembers").insert([
          {
            userid: userid,
            membershipid: membershipId,
            organizationid: organizationId,
            roleid: defaultRoleId,
            months: months,
          },
        ]);

        if (error) {
          console.error("Error inserting data: ", error);
        } else {
          toast.success("Congratulations! You've successfully purchased the membership.");
          console.log("Data inserted successfully: ", data);
          setUserMemberships((prevUserMemberships) => [
            ...prevUserMemberships,
            membershipId,
          ]);
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    },
    [userid, userMemberships]
  );

  const handleDeleteMembership = useCallback(
    async (membershipId) => {
      try {
        // Show SweetAlert confirmation dialog
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: 'You are about to delete this membership. This action cannot be undone.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
          const { error } = await supabase
            .from("memberships")
            .delete()
            .eq("membershipid", membershipId);

          if (error) {
            console.error("Error deleting membership: ", error);
            toast.error("Error deleting membership. Please try again later.");
            return;
          }

          toast.success("Membership deleted successfully.");
          // Optionally, remove the deleted membership from the memberships list
          setUserMemberships((prevUserMemberships) =>
            prevUserMemberships.filter((id) => id !== membershipId)
          );
        }
      } catch (error) {
        console.error("Error: ", error);
        toast.error("An error occurred. Please try again later.");
      }
    },
    []
  );

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  return (
    <div>
      <div id="pricing" className="pb-16">
        {userid && (
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <p className="mt-2 text-2xl font-bold tracking-tight text-light sm:text-2xl">
                Choose Your Membership
              </p>
            </div>
          </div>
        )}
        <div className="mt-16 flex justify-center">
          <RadioGroup
            value={frequency}
            onChange={setFrequency}
            className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200"
          >
            <RadioGroup.Label className="sr-only">Payment frequency</RadioGroup.Label>
            {frequencies.map((option) => (
              <RadioGroup.Option
                key={option.value}
                value={option}
                className={({ checked }) =>
                  classNames(
                    checked ? 'bg-indigo-600 text-white' : 'text-gray-500',
                    'cursor-pointer rounded-full px-2.5 py-1'
                  )
                }
              >
                <span>{option.label}</span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
        <div className="isolate justify-center justify-items-center mx-8 mt-16 flex flex-wrap max-w-md gap-y-8 gap-x-8 sm:mt-20 lg:max-w-none">
          {!userid && (
            <div className="w-full sm:w-64 mr-16">
              <PlusCircleIcon
                className={classNames(
                  'bg-raisinblack outline-2 outline-dashed text-opacity-50 outline-primarydark text-charleston rounded-3xl p-8 xl:p-10 min-w-80 size-80 hover:text-opacity-100 hover:bg-eerieblack focus-visible:outline-primary',
                  'h-full'
                )}
                onClick={onCreateClick}
                strokeWidth={2} // Adjust the stroke width as needed
                stroke="currentColor"
              >
              </PlusCircleIcon>
            </div>
          )}
          {memberships.map((membership, index) => (
            <MembershipCard
              key={membership.membershipid}
              membership={membership}
              index={index + 1}
              totalMemberships={memberships.length + 1}
              userid={userid}
              userMemberships={userMemberships}
              handleBuyPlan={handleBuyPlan}
              handleEditMembership={handleEditMembership}
              handleDeleteMembership={handleDeleteMembership}
              frequency={frequency}
            />
          ))}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
      <MembershipModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        organizationId={selectedOrganizationId || ""}
        membership={selectedMembership}
      />
    </div>
  );
};

export default MembershipTiers;
