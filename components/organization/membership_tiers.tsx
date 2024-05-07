"use client";
import { CheckIcon } from "@heroicons/react/20/solid";
import { Membership, MembershipsProps } from "@/lib/types";





function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MembershipTiers: React.FC<MembershipsProps> = ({ memberships }) => {

  console.log("The view component membership", memberships)

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
                <p className="mt-4 text-sm leading-6 text-light">{membership.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-light">
                    ${membership.registrationfee.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-light">
                    /month
                  </span>
                </p>
                {membership.features && (
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-light">
                    {membership.features.map(feature => (
                      <li key={feature} className="flex gap-x-3">
                        <CheckIcon className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <a
                href="#"
                aria-describedby={membership.membershipid}
                className={classNames(
                  membership.mostPopular
                    ? "bg-primary text-white shadow-sm hover:bg-primarydark"
                    : "text-primarydark ring-1 ring-inset ring-primarydark hover:text-primary hover:ring-primary",
                  "mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                )}
              >
                Buy plan
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembershipTiers;