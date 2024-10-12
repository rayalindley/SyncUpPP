// Filename: app/(organization)/[slug]/dashboard/certificates/create-template/page.tsx
"use client"
import React, { useEffect, useState } from "react";
import CertificateTemplateForm from "@/components/certificates/CertificateTemplateForm";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { useUser } from "@/context/user_context";
import { useRouter } from "next/navigation";

interface Params {
  slug: string;
}

export default function CreateTemplatePage({ params }: { params: Params }) {
  const { slug } = params;
  const { user } = useUser();
  const router = useRouter();
  interface Organization {
    organizationid: string;
    // Add other properties if needed
  }

  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/signin");
    } else {
      fetchOrganizationBySlug(slug).then(({ data }) => {
        setOrganization(data);
      });
    }
  }, [user, slug, router]);

  if (!user || !organization) {
    return null; // or a loading spinner
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-semibold text-light">Create Certificate Template</h1>
      <CertificateTemplateForm organization_id={organization.organizationid} />
    </div>
  );
}
