"use client";
import { Organization } from "@/lib/types";
import OrganizationCard from "./app/OrganizationCard";

const people = [
  {
    name: "Organization N fasdfame",
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

export default function OrgSection({ organizations }: { organizations: Organization[] }) {
  return (
    <div className="bg-eerieblack py-14 sm:py-20">
      <div className="mx-auto max-w-2xl lg:text-center">
        <p
          id="community"
          className="mt-2 text-3xl font-bold tracking-tight text-light sm:text-4xl"
        >
          Explore Our Community
        </p>
        <p className="mt-6 text-lg leading-8 text-light">
          Discover subscribed organizations, their missions, events, and member
          engagement. Click to explore and connect.
        </p>
      </div>
      <div className="mx-auto max-w-7xl px-6 text-left lg:px-8">
        <ul className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {organizations.map((org: Organization) => (
            <OrganizationCard
              key={org.id}
              name={org.name}
              description={org.description}
              organization_size={org.organization_size}
              photo={org.photo}
              slug={org.slug}
              banner={org.banner}
              total_members={org.total_members}
              total_posts={org.total_posts}
              total_events={org.total_events}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
