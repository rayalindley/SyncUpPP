import { CheckIcon } from "@heroicons/react/20/solid";
import { TrashIcon } from "@heroicons/react/20/solid";
import { Membership } from "@/types/membership"; 
import { useState } from 'react';
import ReactDOM from 'react-dom';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from "next/navigation";
import { recordActivity } from "@/lib/track";

const supabase = createClient();

interface MembershipCardProps {
  membership: Membership;
  index: number;
  totalMemberships: number;
  userid?: string;
  isAuthenticated: boolean;
  userMemberships: string[];
  handleSubscribe: (membershipId: string, organizationid: string) => void;
  handleEditMembership: (membership: Membership, organizationid: string) => void;
  handleDeleteMembership: (membershipId: string) => void;
  editable: boolean;
  isCurrentPlan: boolean;
  isProcessing: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MembershipCard: React.FC<MembershipCardProps> = ({
  membership,
  index,
  totalMemberships,
  userid,
  isAuthenticated = false,
  userMemberships,
  handleSubscribe,
  handleEditMembership,
  handleDeleteMembership,
  editable = false,
  isCurrentPlan,
  isProcessing,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isPurchased = userMemberships.includes(membership.membershipid);
  const router = useRouter();

  const registrationFee = membership.registrationfee;
  const isFree = registrationFee <= 0;

  const handleCancelPlan = async () => {
    const { data, error } = await supabase
      .from('organizationmembers')
      .update({ membershipid: null })
      .eq('membershipid', membership.membershipid)
      .eq('userid', userid);

    if (error) {
      console.error('Error updating membershipid to null:', error);
    } else {
      await recordActivity({
        activity_type: "membership_cancel",
        description: `User has cancelled the ${membership.name} membership.`,
      });
    }

    window.location.reload();
    setIsModalOpen(false);
  };

  return (
    <div
      key={membership.membershipid}
      className={classNames(
        membership.mostPopular
          ? "bg-white/5 ring-2 ring-primary"
          : "ring-1 ring-white/10",
        "relative h-full flex flex-col bg-white/5 rounded-3xl p-6",
        "transition-all duration-200 ease-in-out hover:scale-105",
        "max-h-[500px] sm:max-h-none"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-x-2 sm:gap-x-4">
        <div className="flex-1">
          <h3
            id={membership.membershipid}
            className="text-sm sm:text-lg font-semibold leading-6 sm:leading-8 text-white break-words"
            title={membership.name}
          >
            {membership.name}
          </h3>
          <p 
            className="mt-1 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-gray-300 line-clamp-2"
            title={membership.description}
          >
            {membership.description}
          </p>
        </div>
        {membership.mostPopular && (
          <div className="shrink-0">
            <p className="rounded-full bg-primary px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold leading-5 text-white whitespace-nowrap">
              Most popular
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 sm:mt-4 text-center bg-white/5 rounded-xl p-2 sm:p-3">
        {isFree ? (
          <p className="flex items-baseline justify-center gap-x-1">
            <span className="text-xl sm:text-3xl font-bold tracking-tight text-white">Free</span>
          </p>
        ) : (
          <div className="space-y-1">
            <p className="flex items-baseline justify-center gap-x-1 sm:gap-x-2 flex-wrap">
              <span className="text-xl sm:text-3xl font-bold tracking-tight text-white">
                Php {registrationFee.toFixed(2)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-300">
                /{membership.cycletype === 'monthly' ? 'mo' : 'yr'}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 sm:mt-6 flex-grow overflow-hidden">
        <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
          <ul role="list" className="space-y-2 sm:space-y-3 text-xs sm:text-sm leading-5 sm:leading-6 text-gray-300">
            {membership.features &&
              membership.features.map((feature) => (
                <li key={feature} className="flex gap-x-2 sm:gap-x-3">
                  <CheckIcon 
                    className="h-4 w-4 sm:h-5 sm:w-5 flex-none text-primary shrink-0 mt-0.5" 
                    aria-hidden="true" 
                  />
                  <span className="break-words flex-1">{feature}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        {userid ? (
          <button
            onClick={() => {
              if (isCurrentPlan && isHovered) {
                setIsModalOpen(true);
              } else if (!isProcessing) {
                handleSubscribe(
                  membership.membershipid,
                  membership.organizationid || ""
                );
              }
            }}
            className={classNames(
              "w-full rounded-md px-3 py-2 text-center text-sm font-semibold",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              isCurrentPlan
                ? isHovered
                  ? "bg-red-600 text-white"
                  : "cursor-not-allowed bg-gray-300 text-white"
                : membership.mostPopular
                ? "bg-primary text-white shadow-sm hover:bg-primarydark focus-visible:outline-primary"
                : "bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white",
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            )}
            disabled={isCurrentPlan && !isHovered || isProcessing}
          >
            {isProcessing
              ? "Processing..."
              : isCurrentPlan
                ? (isHovered ? "Cancel Plan" : "Current Plan")
                : isFree ? "Join Plan" : "Subscribe"}
          </button>
        ) : null}
      </div>

      {editable && (
        <div className="flex flex-row gap-2 mt-4">
          <button
            onClick={() => handleEditMembership(membership, membership.organizationid || "")}
            className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primarydark focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            disabled={isProcessing}
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteMembership(membership.membershipid)}
            className="rounded-md bg-red-900 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-red-950 focus:ring-2 focus:ring-offset-2 focus:ring-red-900 transition-colors"
            disabled={isProcessing}
          >
            <TrashIcon className="h-5 w-5 text-white mx-auto" />
          </button>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Cancel Plan</h2>
            <p>Are you sure you want to cancel your plan?</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCancelPlan}
                className="mr-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
              >
                No, Keep Plan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MembershipCard;
