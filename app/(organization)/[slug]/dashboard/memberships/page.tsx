"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { fetchOrgMemBySlug, fetchMembersBySlug } from "@/lib/memberships";
import MembershipTiers from "@/components/memberships/membership_tiers";
import MembershipModal from "@/components/memberships/create_membership_modal";
import MemberTable from "@/components/memberships/member_table";
import { Organizations } from "@/types/organizations";
import { Memberships } from "@/types/memberships";
import { User_membership_info } from "@/types/users";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export default function Example() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };

  const [memberships, setMemberships] = useState<Memberships[] | null>(null);
  const [members, setMembers] = useState<User_membership_info[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organizations | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Memberships | undefined>(
    undefined
  );

  const fetchMemberships = async () => {
    try {
      const membershipsData = await fetchOrgMemBySlug(slug);
      setMemberships(membershipsData);
    } catch (err) {
      console.error("Failed to fetch memberships:", err);
      setError((err as Error).message);
    }
  };

  const fetchMembers = async () => {
    try {
      const membersData = await fetchMembersBySlug(slug);
      console.log("membersData", membersData);
      setMembers(membersData);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setError((err as Error).message);
    }
  };

  const fetchOrganization = async () => {
    try {
      const { data, error } = await fetchOrganizationBySlug(slug);
      if (error) {
        setError(error.message);
      } else {
        setOrganization(data);
      }
    } catch (err) {
      console.error("Failed to fetch organization:", err);
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchMemberships();
      fetchMembers();
      fetchOrganization();
    }
  }, [slug]);

  const handleSubmitModal = async () => {
    try {
      if (organization) {
        await fetchMemberships();
        await fetchMembers();
      }
    } catch (error) {
      console.error("Error updating memberships after modal submit:", error);
      setError((error as Error).message);
    }
  };

  const handleDeleteMembership = async (membershipId: string) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You are about to delete this membership. This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const supabase = createClient();
        const { error } = await supabase
          .from("memberships")
          .delete()
          .eq("membershipid", membershipId);

        if (error) {
          console.error("Error deleting membership: ", error);
          toast.error("Error deleting membership. Please try again later.");
          return;
        }

        toast.success("Membership deleted successfully.");
        setMemberships(
          (prevMemberships) =>
            prevMemberships?.filter(
              (membership) => membership.membershipid !== membershipId
            ) || null
        );
      }
    } catch (error) {
      console.error("Error: ", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  const handleEditMembership = (membership: Memberships) => {
    setSelectedMembership(membership);
    setShowModal(true);
  };

  if (!memberships || !members || !organization) {
    return <div>Loading...</div>;
  }

  const handleCreateClick = () => {
    setSelectedMembership(undefined);
    setShowModal(true);
  };

  return (
    <>
      <div className="mt-8 min-w-[1265px]">
        <MembershipModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          organizationid={organization.organizationid}
          membership={selectedMembership}
          onSubmit={handleSubmitModal}
        />

        <MembershipTiers
          memberships={memberships}
          onCreateClick={handleCreateClick}
          onDelete={handleDeleteMembership}
          onEdit={handleEditMembership} // Pass handleEditMembership to MembershipTiers
          editable={true}
        />
        <MemberTable members={members} />
      </div>
    </>
  );
}
