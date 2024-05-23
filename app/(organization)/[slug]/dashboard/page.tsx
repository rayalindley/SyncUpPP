"use client";
import AnalyticsDashboard from "@/components/dashboard/Analytics";
import { deleteOrganization, fetchOrganizationBySlug } from "@/lib/organization";
import { Organization } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string }; // Ensure slug is a string

  const [formValues, setFormValues] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      (async () => {
        try {
          const { data, error } = await fetchOrganizationBySlug(slug);

          console.log(data, error);
          if (error) {
            setError(error.message);
            console.error(error);
          } else {
            setFormValues(data);
          }
        } catch (err) {
          console.error("Failed to fetch organization:", err);
          setError((err as Error).message);
        }
      })();
    }
  }, []);

  const handleDeleteOrg = async () => {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
    });

    if (confirmResult.isConfirmed) {
      console.log(formValues?.organizationid);
      const response = await deleteOrganization("");

      if (!response.error) {
        await Swal.fire({
          title: "Deleted!",
          text: "The organization was successfully deleted.",
          icon: "success",
        });

        // Redirect to /dashboard after successful deletion
        router.push("/dashboard");
      } else {
        Swal.fire({
          title: "Failed!",
          text: response.error.message,
          icon: "error",
        });
      }
    }
  };

  return (
    <div className="min-h-full flex-1 flex-col justify-center bg-eerieblack px-6 py-12  lg:px-8">
      <AnalyticsDashboard organizationId={formValues?.organizationid ?? ""} />
      <div className="mt-4 flex gap-2">
        <a
          className="border-1 rounded-md border border-primary bg-primarydark p-1 px-2 text-sm  text-gray-100 hover:cursor-pointer"
          href={`/${slug}/dashboard/edit`}
        >
          Edit Organization
        </a>
        <button
          className="border-1 rounded-md border border-red-500 bg-red-600 p-1 px-2  text-sm text-gray-100 hover:cursor-pointer"
          onClick={handleDeleteOrg}
        >
          Delete Org
        </button>
      </div>
    </div>
  );
}
