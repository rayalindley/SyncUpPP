import { CheckIcon } from "@heroicons/react/20/solid";
import { TrashIcon } from "@heroicons/react/20/solid";
import { Membership } from "@/types/membership"; 

interface Frequency {
  value: string;
  label: string;
  priceSuffix: string;
}

interface MembershipCardProps {
  membership: Membership;
  index: number;
  totalMemberships: number;
  userid?: string;
  isAuthenticated?: boolean;
  userMemberships: string[];
  handleSubscribe: (membershipId: string, organizationid: string) => void;
  handleEditMembership: (membership: Membership, organizationid: string) => void;
  handleDeleteMembership: (membershipId: string) => void;
  frequency: Frequency;
  editable?: boolean;
  isCurrentPlan: boolean; // Add this prop
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MembershipCard: React.FC<MembershipCardProps> = ({
  membership,
  index,
  totalMemberships,
  userid,
  isAuthenticated = false, // Default to false
  userMemberships,
  handleSubscribe,
  handleEditMembership,
  handleDeleteMembership,
  frequency,
  editable = false,
  isCurrentPlan,
}) => {
  const isPurchased = userMemberships.includes(membership.membershipid);

  const calculateDiscountedRegistrationFee = () => {
    const discountMultiplier = 1 - (membership.yearlydiscount ?? 0) / 100;
    const yearlyFee = membership.registrationfee * 12 * discountMultiplier;
    return frequency.value === "monthly" ? membership.registrationfee : yearlyFee;
  };

  const registrationFee = calculateDiscountedRegistrationFee();
  const isFree = registrationFee <= 0;

  return (
    <div
      key={membership.membershipid}
      className={classNames(
        membership.mostPopular
          ? "bg-white/5 ring-2 ring-primary"
          : "ring-1 ring-white/10",
        "max-w-sm bg-white/5 sm:w-auto rounded-3xl p-8 xl:p-10"
      )}
    >
      <div className="flex items-center justify-between gap-x-4">
        <h3
          id={membership.membershipid}
          className="text-lg font-semibold leading-8 text-white"
        >
          {membership.name}
        </h3>
        {membership.mostPopular ? (
          <p className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold leading-5 text-white">
            Most popular
          </p>
        ) : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-gray-300">{membership.description}</p>
      {isFree ? (
        <p className="mt-6 flex items-baseline gap-x-1">
          <span className="text-4xl font-bold tracking-tight text-white">Free</span>
        </p>
      ) : (
        <p className="mt-6 flex items-baseline gap-x-1">
          <span className="text-4xl font-bold tracking-tight text-white">
            Php {registrationFee.toFixed(2)}
          </span>
          <span className="text-sm font-semibold leading-6 text-gray-300">
            {frequency.priceSuffix}
          </span>
        </p>
      )}

      {userid ? (
        <button
          onClick={() =>
            handleSubscribe(
              membership.membershipid,
              membership.organizationid || ""
            )
          }
          aria-describedby={membership.membershipid}
          className={classNames(
            "mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            isCurrentPlan
              ? "cursor-not-allowed bg-gray-300 text-white"
              : membership.mostPopular
                ? "bg-primary text-white shadow-sm hover:bg-primarydark focus-visible:outline-primary"
                : "bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white"
          )}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? "Current Plan" : isFree ? "Join Plan" : "Subscribe"}
        </button>
      ) : null}

      {editable ? (
        <div className="flex flex-row gap-2">
          <button
            aria-describedby={membership.membershipid}
            onClick={() =>
              handleEditMembership(membership, membership.organizationid || "")
            }
            className="mt-6 block w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Edit Membership
          </button>

          <button
            aria-describedby={membership.membershipid}
            onClick={() => handleDeleteMembership(membership.membershipid)}
            className="mt-6 block rounded-md bg-red-900 px-3 py-2 text-center text-sm font-semibold leading-6 text-white hover:bg-red-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-900"
          >
            <TrashIcon className="size-5 text-white"></TrashIcon>
          </button>
        </div>
      ) : null}

      <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300 xl:mt-10">
        {membership.features &&
          membership.features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <CheckIcon className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
              {feature}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default MembershipCard;
