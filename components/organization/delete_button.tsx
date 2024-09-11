"use client";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { deleteOrganization } from "@/lib/organization";

interface DeleteButtonProps {
  organizationId: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ organizationId }) => {
  const router = useRouter();

  const handleDelete = async () => {
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
      const response = await deleteOrganization(organizationId);
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
    <button
      className="border-1 rounded-md border border-red-500 bg-red-600 p-1 px-2 text-sm text-gray-100 hover:cursor-pointer"
      onClick={handleDelete}
    >
      Delete Org
    </button>
  );
};

export default DeleteButton;
