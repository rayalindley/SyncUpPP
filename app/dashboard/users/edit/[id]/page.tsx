"use client";
import { useParams } from 'next/navigation';
import EditUserDetails from "@/components/app/EditUserDetails";

export default function EditUserProfilePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <EditUserDetails userId={id} />
  );
}
