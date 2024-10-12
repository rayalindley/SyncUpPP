// Filename: app/(organization)/[slug]/dashboard/certificates/templates/page.tsx

import React from "react";
import { fetchCertificateTemplates } from "@/lib/certificates";
import { fetchOrganizationBySlug } from "@/lib/organization";
import CertificateTemplatesTable from "@/components/certificates/CertificateTemplatesTable";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CertificateTemplatesPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { user } = await getUser();
  if (!user) {
    return redirect("/signin");
  }
  const { data: organization } = await fetchOrganizationBySlug(slug);
  const { data: templates } = await fetchCertificateTemplates(organization.organizationid) || [];

  return (
    <div className="py-4">
      <h1 className="text-2xl font-semibold text-light">Certificate Templates</h1>
      <CertificateTemplatesTable templates={templates || []} organizationId={organization.organizationid} />
    </div>
  );
}
