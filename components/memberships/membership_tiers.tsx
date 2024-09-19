"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MembershipCard from "./membership_card";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { RadioGroup } from "@headlessui/react";
import { Membership } from "@/types/membership";
import { Xendit, Invoice as InvoiceClient } from "xendit-node";
import { getUser } from "@/lib/supabase/client";
import type { CreateInvoiceRequest, Invoice } from "xendit-node/invoice/models";

import { useRouter } from "next/navigation";
import { recordActivity } from "@/lib/track";

const xenditClient = new Xendit({
  secretKey: process.env.NEXT_PUBLIC_XENDIT_SECRET_KEY!,
});
const { Invoice } = xenditClient;

const xenditInvoiceClient = new InvoiceClient({
  secretKey: process.env.NEXT_PUBLIC_XENDIT_SECRET_KEY!,
});

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
  organizationid: string; // Add organizationid prop
  isAuthenticated?: boolean;
  onCreateClick?: () => void;
  onDelete?: (membershipId: string) => void;
  onEdit?: (membership: Membership) => void;
  editable?: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MembershipTiers: React.FC<MembershipTiersProps> = ({
  memberships,
  userid,
  organizationid, // Destructure organizationid
  isAuthenticated = false,
  onCreateClick = undefined,
  onDelete = () => {},
  onEdit = () => {},
  editable = false,
}) => {
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [currentMembershipId, setCurrentMembershipId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState(frequencies[0]);
  const router = useRouter();

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
        .eq("userid", userid)
        .eq("organizationid", organizationid)
        .single(); // Use .single() to get a single record

      console.log("fetchmemberships", userMembershipsData);

      // Removed error handling for no rows found
      if (error && error.code !== 'PGRST116') { // Check for specific error code for no rows
        console.error("Error fetching user memberships: ", error);
        toast.error("Error fetching user memberships. Please try again later.");
        return;
      }

      // Check if userMembershipsData is not null and extract the membership ID
      const userMemberships = userMembershipsData ? [userMembershipsData.membershipid] : []; // Set to empty array if no data
      setUserMemberships(userMemberships);
      setCurrentMembershipId(userMemberships.length > 0 ? userMemberships[0] : null);
    } catch (error) {
      console.error("Error: ", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  const handleSubscribe = useCallback(
    async (membershipId: string) => { // Remove organizationid from here
      try {
        // Check if the user is a member of the organization
        const { data: orgMember, error: orgMemberError } = await supabase
          .from("organizationmembers")
          .select("*")
          .eq("userid", userid)
          .eq("organizationid", organizationid) // Use the passed organizationid
          .single();

        if (orgMemberError || !orgMember) {
          console.error("User is not a member of this organization");
          toast.error("You must be a member of this organization to subscribe to a plan.");
          return;
        }

        const { data: membershipData, error: membershipError } = await supabase
          .from("memberships")
          .select("registrationfee, name, description")
          .eq("membershipid", membershipId)
          .single();

        if (membershipError) {
          console.error("Error fetching membership details: ", membershipError);
          toast.error("Error fetching membership details. Please try again later.");
          return;
        }

        const {
          registrationfee: amount,
          name: membershipName,
          description: membershipDescription,
        } = membershipData;

        const { user } = await getUser();

        if (amount === 0) {
          const { data: userMembershipData, error: fetchError } = await supabase
            .from("organizationmembers")
            .select("*")
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
            const { error: updateError } = await supabase
              .from("organizationmembers")
              .update({ membershipid: membershipId })
              .eq("userid", userid)
              .eq("organizationid", organizationid);

            if (updateError) {
              console.error("Error updating membership ID: ", updateError);
              toast.error("Error updating membership. Please try again later.");
              return;
            }

            try {
              await recordActivity({
                organization_id: organizationid,
                activity_type: "membership_subscribe",
                description: `User has subscribed to the ${membershipName} membership.`,
              });

              await recordActivity({
                activity_type: "membership_subscribe",
                description: `User subscribed to the ${membershipName} membership.`,
              });
            } catch (error) {
              console.error("Error recording activity: ", error);
              toast.error(
                "Error recording subscription activity. Please try again later."
              );
            }

            toast.success("Membership updated successfully.");
          } else {
            const { error: insertError } = await supabase
              .from("organizationmembers")
              .insert([
                {
                  userid: userid,
                  membershipid: membershipId,
                  organizationid: organizationid,
                  roleid: defaultRoleId,
                },
              ]);

            if (insertError) {
              console.error("Error inserting membership: ", insertError);
              toast.error("Error inserting membership. Please try again later.");
              return;
            }

            try {
              await recordActivity({
                organization_id: organizationid,
                activity_type: "membership_subscribe",
                description: `User has subscribed to the ${membershipName} membership.`,
              });

              await recordActivity({
                activity_type: "membership_subscribe",
                description: `User subscribed to the ${membershipName} membership.`,
              });
            } catch (error) {
              console.error("Error recording activity: ", error);
              toast.error(
                "Error recording subscription activity. Please try again later."
              );
            }

            

            toast.success(
              "Congratulations! You've successfully purchased the membership."
            );
          }

         

          setUserMemberships((prevUserMemberships) => [
            ...prevUserMemberships,
            membershipId,
          ]);
          setCurrentMembershipId(membershipId);
        } else {
          let { data: orgData, error } = await supabase
            .from("organizations")
            .select("*")
            .eq("organizationid", organizationid)
            .single();

          const data: CreateInvoiceRequest = {
            amount: amount,
            externalId: `${userid}-${membershipId}-${new Date().toISOString()}`,
            description: `Payment for ${membershipName} membership in ${orgData.name}: ${membershipDescription}`,
            currency: "PHP",
            reminderTime: 1,
            successRedirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/${orgData.slug}?tab=membership`,
            payerEmail: user?.email ?? "",
          };

          const invoice: Invoice = await xenditInvoiceClient.createInvoice({
            data,
          });

          if (!invoice) {
            toast.error("Error creating invoice. Please try again later.");
            return;
          } else {
            // toast.success("Invoice created successfully.");

            const { data, error } = await supabase
              .from("payments")
              .insert([
                {
                  amount: amount,
                  organizationId: organizationid,
                  invoiceId: invoice.id,
                  type: "membership",
                  invoiceUrl: invoice.invoiceUrl,
                  invoiceData: invoice,
                  target_id: membershipId,
                },
              ])
              .select();

            // console.log(data, error);

            if (error) {
              toast.error("Error saving invoice. Please try again later.");
            } else {
              // toast.error("Invoice saved successfully.");
              router.push(invoice.invoiceUrl);
            }
          }
        }
      } catch (error) {
        console.error("Error: ", error);
        toast.error("An error occurred. Please try again later.");
      }
    },
    [userid, userMemberships, frequency, router, organizationid] // Add organizationid to dependencies
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
                    checked ? "bg-primary text-white" : "text-gray-500",
                    "cursor-pointer rounded-full px-2.5 py-1"
                  )
                }
              >
                <span>{option.label}</span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>

        <div className="isolate mx-8 mt-16 flex flex-wrap justify-center gap-x-8 gap-y-8 sm:mt-20 lg:max-w-none">
          {memberships.length > 0 ? (
            memberships.map((membership, index) => (
              <MembershipCard
                key={membership.membershipid}
                membership={membership}
                index={index + 1}
                totalMemberships={memberships.length}
                userid={userid}
                isAuthenticated={isAuthenticated}
                userMemberships={userMemberships}
                handleSubscribe={handleSubscribe}
                handleEditMembership={onEdit}
                handleDeleteMembership={onDelete}
                frequency={frequency}
                editable={editable}
                isCurrentPlan={currentMembershipId === membership.membershipid}
              />
            ))
          ) : (
            <p className="w-full text-center text-white">
              No memberships available. Create one to get started!
            </p>
          )}
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
              />
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default MembershipTiers;
