"use client";
import { useParams } from "next/navigation";
import EditUserDetails from "@/components/app/EditUserDetails";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function EditUserProfilePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <div className="top-10 text-gray-100 hover:cursor-pointer">
        <a
          onClick={() => window.history.back()}
          className=" flex items-center gap-2 hover:opacity-80"
        >
          <ArrowLeftIcon className="h-5 w-5" /> Back
        </a>
      </div>

      <EditUserDetails userId={id} />
    </>
  );
}
