"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MembershipModal from "./create_membership_modal";
import MembershipCard from "./membership_card"; // Adjust the import path as needed
import Swal from "sweetalert2";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { RadioGroup } from "@headlessui/react";
import { Membership } from "@/lib/types"; // Import Membership type from central location

const supabase = createClient();

interface Frequency {
  value: string;
  label: string;
  priceSuffix: string;
}

const frequencies: Frequency[] = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/year" },
];

interface MembershipTiersProps {
  memberships: Membership[];
  userid?: string;
  onCreateClick?: () => void;
}

const MembershipTiers: React.FC<MembershipTiersProps> = ({
  memberships,
  userid,
  onCreateClick = undefined,
}) => {
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Membership | undefined>(
    undefined
  );
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(
    null
  );
  const [frequency, setFrequency] = useState(frequencies[0]);

  const handleEditMembership = (membership: Membership, organizationid: string) => {
    setSelectedMembership(membership);
    setSelectedOrganizationId(organizationid);
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

      const userMemberships =
        userMembershipsData?.map(
          (membership: { membershipid: string }) => membership.membershipid
        ) || [];
      setUserMemberships(userMemberships);
    } catch (error) {
      console.error("Error: ", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  const handleBuyPlan = useCallback(
    async (membershipId: string, organizationid: string) => {
      try {
        if (userMemberships.includes(membershipId)) {
          toast.warning("You already have this membership.");
          return;
        }

        const months = frequency.value === "monthly" ? 12 : 1;

        const { data: rolesData, error: rolesError } = await supabase
          .from("organization_roles")
          .select("role_id")
          .eq("org_id", organizationid)
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
            organizationid: organizationid,
            roleid: defaultRoleId,
            months: months,
          },
        ]);

        if (error) {
          console.error("Error inserting data: ", error);
        } else {
          toast.success("Congratulations! You've successfully purchased the membership.");
          setUserMemberships((prevUserMemberships) => [
            ...prevUserMemberships,
            membershipId,
          ]);
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    },
    [userid, userMemberships, frequency]
  );

  const handleDeleteMembership = useCallback(async (membershipId: string) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You are about to delete this membership. This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
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
        setUserMemberships((prevUserMemberships) =>
          prevUserMemberships.filter((id) => id !== membershipId)
        );
      }
    } catch (error) {
      console.error("Error: ", error);
      toast.error("An error occurred. Please try again later.");
    }
  }, []);

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
                    checked ? "bg-indigo-600 text-white" : "text-gray-500",
                    "cursor-pointer rounded-full px-2.5 py-1"
                  )
                }
              >
                <span>{option.label}</span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
        <div className="isolate mx-8 mt-16 flex max-w-md flex-wrap justify-center justify-items-center gap-x-8 gap-y-8 sm:mt-20 lg:max-w-none">
          {!userid && (
            <div className="mr-16 w-full sm:w-64">
              <PlusCircleIcon
                className={classNames(
                  "size-80 min-w-80 rounded-3xl bg-raisinblack p-8 text-charleston text-opacity-50 outline-dashed outline-2 outline-primarydark hover:bg-eerieblack hover:text-opacity-100 focus-visible:outline-primary xl:p-10",
                  "h-full"
                )}
                onClick={onCreateClick}
                strokeWidth={2}
                stroke="currentColor"
              ></PlusCircleIcon>
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
        organizationid={selectedOrganizationId || ""}
        membership={selectedMembership}
      />
    </div>
  );
};

export default MembershipTiers;
