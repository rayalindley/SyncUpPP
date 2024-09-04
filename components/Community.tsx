"use client";
import { OrganizationModel } from "@/models/organizationModel";
import OrganizationCard from "./app/OrganizationCard";

export default function OrgSection({
  organizations,
}: {
  organizations: OrganizationModel[];
}) {
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
          {organizations.map((orgData: any) => {
            const org = new OrganizationModel(orgData);
            return (
              <OrganizationCard
                key={org.getOrganizationId() ?? ""}
                name={org.getName() ?? "Unknown Name"}
                description={org.getDescription() ?? "No description available"}
                organization_size={org.getOrganizationSize() ?? 0}
                photo={org.getPhoto() ?? "default-photo-url.jpg"}
                slug={org.getSlug() ?? ""}
                banner={org.getBanner() ?? "default-banner-url.jpg"}
                total_members={org.getTotal_members() ?? 0}
                total_posts={org.getTotal_posts() ?? 0}
                total_events={org.getTotal_events() ?? 0}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}
