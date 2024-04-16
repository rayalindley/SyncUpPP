import { UserGroupIcon } from "@heroicons/react/24/outline";

const people = [
  {
    name: "Organization Name",
    membercount: "230",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    xUrl: "#",
    linkedinUrl: "#",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    name: "Organization Name",
    membercount: "230",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    xUrl: "#",
    linkedinUrl: "#",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    name: "Organization Name",
    membercount: "230",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    xUrl: "#",
    linkedinUrl: "#",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];

export default function Example() {
  return (
    <div className="bg-eerieblack py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-chinawhite sm:text-4xl">
            Explore Our Vibrant Community
          </h2>
          <p className="mt-4 text-lg leading-8 text-chinawhite">
            Discover subscribed organizations, their missions, events, and member
            engagement. Click to explore and connect.
          </p>
        </div>
        <ul className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {people.map((person) => (
            <li key={person.name} className="rounded-2xl bg-charleston px-8 py-10">
              <img
                className="mx-auto h-48 w-48 rounded-full md:h-56 md:w-56"
                src={person.imageUrl}
                alt=""
              />
              <h3 className="mt-6 text-base font-semibold leading-7 tracking-tight text-chinawhite">
                {person.name}
              </h3>
              <p className="text-sm leading-6 text-gray-400">
                <UserGroupIcon className="mx-1 -mt-1 inline-block h-5 w-5 text-junglegreen" />
                {person.membercount} members
              </p>
              <p className="mt-6 text-base font-normal text-chinawhite">
                {person.description}
              </p>
              <div className="mt-2 flex items-center justify-center gap-x-6">
                <a
                  href="#"
                  className="my-2 rounded-md bg-junglegreen px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-junglegreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  View
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
