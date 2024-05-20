import { UserGroupIcon } from "@heroicons/react/24/outline";

export default function OrganizationCard({
  name,
  description,
  organization_size,
  photo,
  slug,
}) {
  // Define the base URL for your Supabase storage bucket
  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  // Use the default photo if `photo` is not provided
  const photoUrl = photo || "./images/placeholder.png";

  return (
    <div className="mx-auto max-w-2xl transform gap-6 rounded-2xl border border-[#2e2e2e] bg-[#232323] px-8 py-10 transition duration-200 hover:scale-[1.03] hover:bg-charleston lg:mx-0 lg:max-w-none lg:gap-8">
      <img
        className="mx-auto h-48 w-48 rounded-full md:h-56 md:w-56"
        src={`${supabaseStorageBaseUrl}/${photoUrl}`}
        alt=""
      />
      <h3 className="mt-6 text-base font-semibold leading-7 tracking-tight text-light">
        {name}
      </h3>
      <p className="text-sm leading-6 text-gray-400">
        <UserGroupIcon className="mx-1 -mt-1 inline-block h-5 w-5 text-primary" />
        {organization_size} members
      </p>
      <p className="mt-6 text-base font-normal text-light">{description}</p>
      <div className="mt-2 flex items-center justify-center gap-x-6">
        <a
          href={`./${slug}`}
          className="my-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          View
        </a>
      </div>
    </div>
  );
}
