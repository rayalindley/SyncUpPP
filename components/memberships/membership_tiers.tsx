"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MembershipCard from "./membership_card";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { RadioGroup } from "@headlessui/react";
import { Membership } from "@/lib/types";

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
  isAuthenticated?: boolean; // Add isAuthenticated prop
  onCreateClick?: () => void;
  onDelete?: (membershipId: string) => void;
  onEdit?: (membership: Membership) => void; // Add onEdit prop
  editable?: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MembershipTiers: React.FC<MembershipTiersProps> = ({
  memberships,
  userid,
  isAuthenticated = false, // Default to false
  onCreateClick = undefined,
  onDelete = () => {},
  onEdit = () => {},
  editable = false,
}) => {
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(frequencies[0]);

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
        const { data: userMembershipData, error: fetchError } = await supabase
          .from("organizationmembers")
          .select("membershipid, roleid")
          .eq("userid", userid)
          .eq("organizationid", organizationid)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching user membership: ", fetchError);
          toast.error("Error fetching user membership. Please try again later.");
          return;
        }

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

        if (userMembershipData) {
          // User is already a member, update the roleid
          const { error: updateError } = await supabase
            .from("organizationmembers")
            .update({ roleid: defaultRoleId })
            .eq("userid", userid)
            .eq("organizationid", organizationid);

          if (updateError) {
            console.error("Error updating membership role: ", updateError);
            toast.error("Error updating membership role. Please try again later.");
            return;
          }

          toast.success("Membership role updated successfully.");
        } else {
          // User is not a member, insert new membership
          const { error: insertError } = await supabase
            .from("organizationmembers")
            .insert([
              {
                userid: userid,
                membershipid: membershipId,
                organizationid: organizationid,
                roleid: defaultRoleId,
                months: frequency.value === "monthly" ? 12 : 1,
              },
            ]);

          if (insertError) {
            console.error("Error inserting membership: ", insertError);
            toast.error("Error inserting membership. Please try again later.");
            return;
          }

          toast.success("Congratulations! You've successfully purchased the membership.");
        }

        setUserMemberships((prevUserMemberships) => [
          ...prevUserMemberships,
          membershipId,
        ]);
      } catch (error) {
        console.error("Error: ", error);
        toast.error("An error occurred. Please try again later.");
      }
    },
    [userid, userMemberships, frequency]
  );

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
          {editable && (
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
              isAuthenticated={isAuthenticated}
              userMemberships={userMemberships}
              handleBuyPlan={handleBuyPlan}
              handleEditMembership={() => onEdit(membership)} // Use onEdit from props
              handleDeleteMembership={onDelete} // Use onDelete from props
              frequency={frequency}
              editable={editable}
            />
          ))}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default MembershipTiers;
