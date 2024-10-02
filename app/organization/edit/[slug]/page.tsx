"use client";
import CreateOrganizationForm from "@/components/create_organization_form";
import { fetchOrganizationBySlug, check_permissions } from "@/lib/organization";
import { createClient, getUser } from "@/lib/supabase/client";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StepsProvider } from "react-step-builder";
import Preloader from "@/components/preloader";

const supabase = createClient();

export default function Example() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };
  const [formValues, setFormValues] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        console.log("Starting authorization check...");
        
        const { user } = await getUser();
        if (!user) {
          console.log("Authorization failed: User not logged in");
          router.back();
          return;
        }
        console.log("User logged in:", user.id);

        if (user.user_metadata.role === 'superadmin') {
          console.log("User is superadmin, authorization granted");
          setIsAuthorized(true);
        } else {
          console.log("User is not superadmin, checking organization membership...");
          
          const { data: org, error: orgError } = await fetchOrganizationBySlug(slug as string);
          if (orgError) {
            console.log("Error fetching organization", orgError);
            router.back();
            return;
          }
          console.log("Organization fetched:", org.organizationid);

          // Check if user is a member of the organization
          const { data: membership, error: membershipError } = await supabase
            .from("organizationmembers")
            .select("roleid")
            .eq("userid", user.id)
            .eq("organizationid", org.organizationid)
            .single();

          if (membershipError) {
            console.log("Error checking organization membership", membershipError);
            router.back();
            return;
          }

          if (!membership) {
            console.log("User is not a member of this organization");
            router.back();
            return;
          }

          console.log("User is a member, checking permissions...");
          const hasPermission = await check_permissions(user.id, org.organizationid, 'edit_organization');
          console.log("Permission check result:", hasPermission);
          setIsAuthorized(hasPermission);

          if (hasPermission) {
            console.log("User is authorized, setting form values");
            setFormValues(org);
          } else {
            console.log("Authorization failed: User doesn't have permission to edit this organization");
            router.back();
            return;
          }
        }
      } catch (err) {
        console.error("Unexpected error during authorization check:", err);
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [slug, router]);

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center bg-eerieblack px-6 py-12  lg:px-8">
        <div className="fixed top-10 text-gray-100 hover:cursor-pointer">
          <a
            onClick={() => router.back()}
            className=" flex items-center gap-2 hover:opacity-80"
          >
            <ArrowLeftIcon className="h-5 w-5" /> Back
          </a>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img className="mx-auto h-10 w-auto" src="/syncup.png" alt="SyncUp" />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Editing Organization
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
          {isAuthorized ? (
            <StepsProvider>
              <CreateOrganizationForm formValues={formValues} />
            </StepsProvider>
          ) : null}
        </div>
      </div>
    </>
  );
}
