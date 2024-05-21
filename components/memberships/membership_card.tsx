import { CheckIcon } from "@heroicons/react/20/solid";
import { Membership } from "@/lib/types";
import { TrashIcon } from "@heroicons/react/20/solid";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MembershipCard = ({
  membership,
  index,
  totalMemberships,
  userid,
  userMemberships, 
  handleBuyPlan,
  handleEditMembership,
  handleDeleteMembership,
}) => {

const isPurchased = userMemberships.includes(membership.membershipid);

  return (
    <div
      key={membership.membershipid}
      className={classNames(
        membership.mostPopular ? 'bg-white/5 ring-2 ring-primary' : 'ring-1 ring-white/10',
        'rounded-3xl p-8 xl:p-10 min-w-80'
      )}
    >
      <div className="flex items-center justify-between gap-x-4">
        <h3 id={membership.membershipid} className="text-lg font-semibold leading-8 text-white">
          {membership.name}
        </h3>
        {membership.mostPopular ? (
          <p className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold leading-5 text-white">
            Most popular
          </p>
        ) : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-gray-300">
        {membership.description}
      </p>
      <p className="mt-6 flex items-baseline gap-x-1">
        <span className="text-4xl font-bold tracking-tight text-white">
          ${membership.registrationfee.toFixed(2)}
        </span>
        <span className="text-sm font-semibold leading-6 text-gray-300">
          /month
        </span>
      </p>
      {userid ? (
        <button
          onClick={() =>
            handleBuyPlan(membership.membershipid, membership.organizationid)
          }
          aria-describedby={membership.membershipid}
          className={classNames(
            'mt-6 w-full block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            isPurchased
              ? 'cursor-not-allowed bg-gray-300 text-white'
              : membership.mostPopular
              ? 'bg-primary text-white shadow-sm hover:bg-primarydark focus-visible:outline-primary'
              : 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white'
          )}
          disabled={userMemberships.includes(membership.membershipid)}
        >
          {userMemberships.includes(membership.membershipid)
            ? "Already Purchased"
            : "Buy Plan"}
        </button>
      ) : (
        <div className="flex flex-row gap-2">
        <button
          aria-describedby={membership.membershipid}
          onClick={() => handleEditMembership(membership, membership.organizationid)}
          className= " w-full bg-primary text-white shadow-sm hover:bg-primarydark focus-visible:outline-primary mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Edit Membership
        </button>

        <button
          aria-describedby={membership.membershipid}
          onClick={() => handleDeleteMembership(membership.membershipid)}
          className=" bg-red-900 text-white hover:bg-red-950 focus-visible:outline-rose-900 mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
        >
            <TrashIcon className="text-white size-5"></TrashIcon>
        </button>


        </div>
      )}
      <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300 xl:mt-10">
        {membership.features.map((feature) => (
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
