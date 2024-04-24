import { UserGroupIcon } from "@heroicons/react/24/outline";

export default function OrganizationCard({
  name,
  description,
  imageUrl,
  membercount,
  xUrl,
  linkedinUrl,
}) {
  return (
    <div className="bg-eerieblack py-12">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <div className="mx-automax-w-2xl gap-6 lg:mx-0 lg:max-w-none lg:gap-8">
          <div
            key={name}
            className="transform rounded-2xl px-8 py-10 transition duration-200 hover:scale-105 hover:bg-charleston"
          >
            <img
              className="mx-auto h-48 w-48 rounded-full md:h-56 md:w-56"
              src={imageUrl}
              alt=""
            />
            <h3 className="mt-6 text-base font-semibold leading-7 tracking-tight text-light">
              {name}
            </h3>
            <p className="text-sm leading-6 text-gray-400">
              <UserGroupIcon className="h-y5 mx-1 -mt-1 inline-block w-5 text-primary" />
              {membercount} members
            </p>
            <p className="mt-6 text-base font-normal text-light">{description}</p>
            <div className="mt-2 flex items-center justify-center gap-x-6">
              <a
                href={xUrl} // Assuming this should be the URL to view the organization
                className="my-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                View
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
