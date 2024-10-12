// Filename: components/certificates/CertificateTemplatesTable.tsx

import React from "react";
import Link from "next/link";

interface Template {
  template_id: string;
  template_name: string;
}

interface CertificateTemplatesTableProps {
  templates: Template[];
  organizationId: string;
}

const CertificateTemplatesTable: React.FC<CertificateTemplatesTableProps> = ({ templates, organizationId }) => {
  return (
    <div className="mt-4">
      <Link href={`/organization/${organizationId}/dashboard/certificates/create-template`}>
        <button className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark">
          Create New Template
        </button>
      </Link>
      <table className="mt-4 w-full table-auto text-light">
        <thead>
          <tr>
            <th className="border-b p-2 text-left">Template Name</th>
            <th className="border-b p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.template_id}>
              <td className="border-b p-2">{template.template_name}</td>
              <td className="border-b p-2">
                <Link
                  href={`/organization/${organizationId}/dashboard/certificates/edit-template/${template.template_id}`}
                  className="text-primary hover:text-primarydark"
                >
                  Edit
                </Link>
                {/* Add Delete functionality if needed */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CertificateTemplatesTable;
