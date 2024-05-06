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
        .from('organizations')
        .select('organizationid, name, slug')
        .eq('adminid', user.id);

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
    <div className="p-4 bg-dark">
      <h1 className="text-2xl font-bold mb-4 text-light">Newsletter Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <div
            key={org.organizationid}
            className="cursor-pointer p-4 border rounded shadow-md text-light hover:bg-gray-700"
            onClick={() => handleOrganizationClick(org.slug)}
          >
            <h2 className="text-xl font-semibold">{org.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
