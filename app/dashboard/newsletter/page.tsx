"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";

export default function NewsletterPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    if (!user) return;

    const supabase = createClient();
    try {
      let { data: orgs, error } = await supabase
        .from("organizations")
        .select("organizationid, name, slug, description")
        .eq("adminid", user.id);

      if (error) {
        console.error("Error fetching organizations:", error);
        return;
      }

      setOrganizations(orgs || []);
    } catch (e) {
      console.error("Unexpected error fetching organizations:", e);
    }
  };

  const handleOrganizationClick = (slug: string) => {
    window.location.href = `/newsletter/${slug}`;
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-light">Newsletter</h1>
      <p className="text-[#525252]">Select an organization to access its newsletter creation page.</p>
      <div className="isolate mx-auto mt-5 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl xl:mx-0 xl:max-w-none xl:grid-cols-4">
        {organizations.length === 0 && (
          <p className="text-light">No organizations found.</p>
        )}
        {organizations.map((org, index) => (
          <a
            key={index}
            href={`/newsletter/${org.slug}`}
            className="w-full rounded-xl bg-raisinblack p-5 ring-1 ring-charleston hover:cursor-pointer"
            onClick={() => handleOrganizationClick(org.slug)}
          >
            <h2 className="text-lg font-semibold leading-8 text-gray-300">{org.name}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              {org.description || "No description available."}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
