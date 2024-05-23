"use client";
import StatisticsSection from "@/components/dashboard/StatisticsSection";
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
  }, [slug]);

  const handleEditOrg = () => {
    if (slug) {
      router.push(`/${slug}/dashboard/edit`);
    }
  };

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
      const response = await deleteOrganization(formValues?.organizationid || "");

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
      <StatisticsSection />
      <div className="mt-4 flex justify-center">
        <button
          className="mr-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark"
          onClick={handleEditOrg}
        >
          Edit Org
        </button>
        <button
          className="rounded-md bg-red-500 px-4 py-2 text-white"
          onClick={handleDeleteOrg}
        >
          Delete Org
        </button>
      </div>
    </div>
  );
}
