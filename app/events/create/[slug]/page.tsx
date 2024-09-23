"use client";
import CreateEventForm from "@/components/create_event_form";
import Preloader from "@/components/preloader";
import { check_permissions, fetchOrganizationBySlug } from "@/lib/organization";
import { getUser } from "@/lib/supabase/client";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateEventPage() {
  const router = useRouter();
  const params = useParams() as { slug: string };
  const slug = params.slug;
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const fetchOrganization = async () => {
      if (typeof slug !== "string") {
        setError("Invalid slug type");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await fetchOrganizationBySlug(slug);
        if (error) {
          setError(error.message);
          console.error(error);
        } else {
          setOrganization(data);
        }
      } catch (err) {
        console.error("Failed to fetch organization:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    const checkPermissions = async () => {
      const { user } = await getUser();
      try {
        const organization = await fetchOrganizationBySlug(slug as string);
        if (organization && organization.data) {
          const permission = await check_permissions(
            user?.id || "",
            organization.data.organizationid,
            "create_events"
          );
          setHasPermission(permission);
        }
      } catch (error) {
        console.error("Failed to check permissions", error);
      } finally {
        setLoading(false); // Ensure loading is set to false after permission check
      }
    };

    if (slug) {
      fetchOrganization();
      checkPermissions();
    }
  }, [slug]);

  if (loading) {
    return <Preloader />;
  }

  if (!hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Events Creation</h1>
          <p className="text-lg">
            You do not have permission to create events for this organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center bg-eerieblack px-6 py-12 lg:px-8">
        <div className="fixed top-10 text-gray-100 hover:cursor-pointer">
          <a
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <ArrowLeftIcon className="h-5 w-5" /> Back
          </a>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img className="mx-auto h-10 w-auto" src="/syncup.png" alt="SyncUp" />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Create an Event
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
          <CreateEventForm organizationid={(organization as any)?.organizationid} />
        </div>
      </div>
    </>
  );
}
