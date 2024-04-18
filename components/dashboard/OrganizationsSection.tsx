const organizations = [
  {
    name: "Organization 1",
    description:
      "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus, molestiae.",
    href: "#",
  },
  {
    name: "Organization 2",
    description:
      "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus, molestiae.",
    href: "#",
  },
  {
    name: "Organization 3",
    description:
      "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus, molestiae.",
    href: "#",
  },
  {
    name: "Organization 4",
    description:
      "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus, molestiae.",
    href: "#",
  },
];

export default function OrganizationSection() {
  return (
    <div className="mt-10">
      <a
        href="/organization/create"
        className="border-1 border-primary bg-primarydark rounded-md border p-1 px-2 text-sm text-gray-100 hover:cursor-pointer"
      >
        New Organization
      </a>
      <h3 className="mt-5 text-base font-semibold leading-6 text-gray-300">
        Organizations
      </h3>
      <div className="isolate mx-auto mt-5 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl xl:mx-0 xl:max-w-none xl:grid-cols-4">
        {organizations.map((org, index) => (
          <a key={index} href={org.href}>
            <div className={"rounded-xl bg-raisinblack p-5 ring-1 ring-charleston"}>
              <h2 className={"text-lg font-semibold leading-8 text-gray-300"}>
                {org.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{org.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
