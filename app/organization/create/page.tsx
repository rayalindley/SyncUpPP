"use client";
import CreateOrganizationForm from "@/components/create_organization_form";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { StepsProvider } from "react-step-builder";

export default function Example() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-eerieblack px-6 py-12 lg:px-10">
      {/* Back Button */}
      <div
        onClick={() => router.back()}
        className="fixed top-10 left-6 flex items-center gap-2 text-gray-100 hover:cursor-pointer hover:opacity-80"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back
      </div>

      {/* Header */}
      <div className="mx-auto w-full max-w-7xl">
        <img className="h-10 w-auto" src="/syncup.png" alt="SyncUp" />

        <h2 className="mt-8 text-3xl font-bold text-white">
          Create an Organization
        </h2>
      </div>

      {/* Form */}
      <div className="mt-10 w-full">
        <StepsProvider>
          <CreateOrganizationForm formValues={undefined} />
        </StepsProvider>
      </div>
    </div>
  );
}
