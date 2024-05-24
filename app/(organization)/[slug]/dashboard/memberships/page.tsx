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

export default function Example() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };

  const [memberships, setMemberships] = useState<Memberships[] | null>(null);
  const [members, setMembers] = useState<User_membership_info[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organizations | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const membershipsData = await fetchOrgMemBySlug(slug);
        setMemberships(membershipsData);
      } catch (err) {
        console.error("Failed to fetch memberships:", err);
        setError((err as Error).message);
      }
    };

    if (slug) {
      fetchMemberships();
    }
  }, [slug]);

  useEffect(() => {
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

    if (slug) {
      fetchMembers();
    }
  }, [slug]);

  useEffect(() => {
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

    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  const handleSubmitModal = async () => {
    try {
      if (organization) {
        const updatedMemberships = await fetchOrgMemBySlug(organization.organizationid);
        setMemberships(updatedMemberships);
      }
    } catch (error) {
      console.error("Error updating memberships after modal submit:", error);
      setError((error as Error).message);
    }
  };

  if (!memberships || !members || !organization) {
    return <div>Loading...</div>;
  }

  const handleCreateClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className="mt-8 min-w-[1265px]">
        <MembershipModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          organizationid={organization.organizationid}
          membership={undefined}
        />

        <MembershipTiers memberships={memberships} onCreateClick={handleCreateClick} />
        <MemberTable members={members} />
      </div>
    </>
  );
}
