"use client";
import CreateOrganizationForm from "@/components/create_organization_form";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StepsProvider } from "react-step-builder";

export default function Example() {
  const router = useRouter();

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
          <img className="mx-auto h-10 w-auto" src="/Symbian.png" alt="SyncUp" />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            Editing Organization
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
          <StepsProvider>
            <CreateOrganizationForm formValues={formValues} />
          </StepsProvider>

          <p className="mt-10 text-center text-sm text-gray-400">
            Not a member?{" "}
            <a
              href="#"
              className="font-semibold leading-6 text-primarydark hover:text-primary"
            >
              Start a 14 day free trial
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
