"use client";
import { useState, useEffect } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { Membership, MembershipsProps } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Initialize Supabase client
const supabase = createClient();

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MembershipTiers: React.FC<MembershipsProps> = ({ memberships, userid }) => {
  // console.log("The view component membership ", memberships);

  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  useEffect(() => {
    fetchUserMemberships();
  }, []);

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
        userMembershipsData?.map((membership: any) => membership.membershipid) || [];
      setUserMemberships(userMemberships);
    } catch (error) {
      console.error("Error: ", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  const handleBuyPlan = useCallback(
    async (membershipId: string, organizationId: string) => {
      try {
        if (userMemberships.includes(membershipId)) {
          // If user already has the membership, notify and return
          toast.warning("You already have this membership.");
          return;
        }

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
          },
        ]);

        if (error) {
          console.error("Error inserting data: ", error);
        } else {
          toast.success("Congratulations! You've successfully purchased the membership.");
          // console.log("Data inserted successfully: ", data);
          setUserMemberships((prevUserMemberships) => [
            ...prevUserMemberships,
            membershipId,
          ]);
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    },
    [userid]
  );

  return (
    <div id="pricing" className="pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mt-2 text-2xl font-bold tracking-tight text-light sm:text-2xl">
            Choose Your Membership
          </p>
        </div>
        <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-y-8 sm:mt-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {memberships.map((membership, index) => (
            <div
              key={membership.membershipid}
              className={classNames(
                membership.mostPopular ? "lg:z-10 lg:rounded-b-none" : "lg:mt-8",
                index === 0 ? "lg:rounded-r-none" : "",
                index === memberships.length - 1 ? "lg:rounded-l-none" : "",
                "flex flex-col justify-between rounded-3xl bg-raisinblack p-8 ring-1 ring-gray-200 xl:p-10"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={membership.membershipid}
                    className={classNames(
                      membership.mostPopular ? "text-primary" : "text-light",
                      "text-lg font-semibold leading-8"
                    )}
                  >
                    {membership.name}
                  </h3>
                  {membership.mostPopular && (
                    <p className="rounded-full bg-primarydark px-2.5 py-1 text-xs font-semibold leading-5 text-light">
                      Most popular
                    </p>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 text-light">
                  {membership.description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-light">
                    ${membership.registrationfee.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-light">
                    /month
                  </span>
                </p>
                {membership.features &&
                  membership.features.some((feature) => feature.trim() !== "") && (
                    <ul
                      role="list"
                      className="mt-8 space-y-3 text-sm leading-6 text-light"
                    >
                      {membership.features.map((feature) => {
                        if (feature.trim() !== "") {
                          return (
                            <li key={feature} className="flex gap-x-3">
                              <CheckIcon
                                className="h-6 w-5 flex-none text-primary"
                                aria-hidden="true"
                              />
                              {feature}
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  )}
              </div>
              <button
                onClick={() =>
                  handleBuyPlan(membership.membershipid, membership.organizationid)
                }
                aria-describedby={membership.membershipid}
                className={classNames(
                  membership.mostPopular
                    ? "bg-primary text-white shadow-sm hover:bg-primarydark"
                    : "text-primarydark ring-1 ring-inset ring-primarydark hover:text-primary hover:ring-primary",
                  userMemberships.includes(membership.membershipid)
                    ? "cursor-not-allowed bg-gray-300"
                    : "hover:bg-primarydark",
                  "mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6"
                )}
                disabled={userMemberships.includes(membership.membershipid)}
              >
                {userMemberships.includes(membership.membershipid)
                  ? "Already Purchased"
                  : "Buy Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* ToastContainer to display toast messages */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default MembershipTiers;
