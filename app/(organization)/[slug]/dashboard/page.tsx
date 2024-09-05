"use client";
import AnalyticsDashboard from "@/components/dashboard/_analytics";
import { deleteOrganization, fetchOrganizationBySlug } from "@/lib/organization";
import { Organization } from "@/types/organization";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function SettingsPage() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string }; // Ensure slug is a string

  const [formValues, setFormValues] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const saveScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollTop } = scrollRef.current;
      localStorage.setItem("scrollPosition", scrollTop.toString());
    }
  };

  const restoreScrollPosition = () => {
    if (scrollRef.current) {
      const scrollPosition = localStorage.getItem("scrollPosition");
      if (scrollPosition) {
        scrollRef.current.scrollTop = parseInt(scrollPosition, 10);
      }
    }
  };

  useEffect(() => {
    restoreScrollPosition();
  }, []);

  useEffect(() => {
    // console.log(slug);
    if (slug) {
      (async () => {
        try {
          const { data, error } = await fetchOrganizationBySlug(slug);

          // console.log(data, error);
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

  useEffect(() => {
    const channels = ["organizationmembers", "events", "posts", "comments"];
    channels.forEach((channel) => {
      supabase
        .channel(channel)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: channel },
          (payload) => {
            // console.log("Change received!", payload);
            saveScrollPosition();
            setReloadFlag((prev) => !prev); // Toggle the flag to force re-render
          }
        )
        .subscribe();
    });
  }, []);

  useEffect(() => {
    restoreScrollPosition();
  }, [reloadFlag]);

  const handleDeleteOrg = async (orgID: string) => {
    // console.log(orgID);

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
      const response = await deleteOrganization(orgID);
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
    <div ref={scrollRef} className="min-h-full flex-1 flex-col justify-center bg-eerieblack px-6 py-12 lg:px-8">
      <AnalyticsDashboard organizationid={formValues?.organizationid ?? ""} />
      <div className="mt-4 flex gap-2">
        <a
          className="border-1 rounded-md border border-primary bg-primarydark p-1 px-2 text-sm text-gray-100 hover:cursor-pointer"
          href={`/${slug}/dashboard/edit`}
        >
          Edit Organization
        </a>
        <button
          className="border-1 rounded-md border border-red-500 bg-red-600 p-1 px-2 text-sm text-gray-100 hover:cursor-pointer"
          onClick={() => handleDeleteOrg(formValues?.organizationid ?? "")}
        >
          Delete Org
        </button>
      </div>
    </div>
  );
}
