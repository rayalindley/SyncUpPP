"use client";

import CreateOrganizationForm from "@/components/create_organization_form";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StepsProvider } from "react-step-builder";

export default function SettingsPage() {
  const { slug } = useParams();
  const [formValues, setFormValues] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      (async () => {
        try {
          const { data, error } = await fetchOrganizationBySlug(slug);
          if (error) {
            setError(error);
            console.error(error);
          } else {
            setFormValues(data);
          }
        } catch (err) {
          console.error("Failed to fetch organization:", err);
          setError(err.message);
        }
      })();
    }
  }, [slug]);

  return (
    <div className="min-h-full flex-1 flex-col justify-center bg-eerieblack px-6 py-12  lg:px-8">
      <StepsProvider>
        <CreateOrganizationForm formValues={formValues} />
      </StepsProvider>
    </div>
  );
}
