"use client";

import { useState } from "react";
import MembershipModal from "@/components/memberships/create_membership_modal";
import MembershipTiers from "@/components/memberships/membership_tiers";
import { Memberships } from "@/types/memberships";
import { Organizations } from "@/types/organizations";
import { UserMembershipInfo } from "@/types/user_membership_info";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { fetchOrgMemBySlug } from "@/lib/memberships";

interface MembershipTiersClientProps {
  memberships: Memberships[];
  members: UserMembershipInfo[];
  organization: Organizations;
}

export default function MembershipTiersClient({
  memberships: initialMemberships,
  members,
  organization,
}: MembershipTiersClientProps) {
  const [memberships, setMemberships] = useState(initialMemberships);
  const [showModal, setShowModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Memberships | undefined>(
    undefined
  );

  const handleSubmitModal = async () => {
    const updatedMemberships = await fetchOrgMemBySlug(organization.slug);
    if (updatedMemberships) {
      setMemberships(updatedMemberships);
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
          throw error;
        }

        toast.success("Membership deleted successfully.");
        setMemberships((prevMemberships) =>
          prevMemberships.filter((membership) => membership.membershipid !== membershipId)
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

  const handleCreateClick = () => {
    setSelectedMembership(undefined);
    setShowModal(true);
  };

  console.log(memberships);

  return (
    <>
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
        onEdit={handleEditMembership}
        editable={true}
      />
    </>
  );
}
