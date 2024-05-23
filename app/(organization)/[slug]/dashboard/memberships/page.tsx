"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StepsProvider } from "react-step-builder";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { fetchOrgMemBySlug } from "@/lib/memberships";
import { fetchMembersBySlug } from "@/lib/memberships"; // Import the fetchMembersBySlug function
import SingleMembershipsTable from "@/components/memberships/SingleOrgMembershipsTable";
import MembershipTiers from "@/components/memberships/membership_tiers";

import MembershipModal from "@/components/memberships/create_membership_modal";
import MemberTable from "@/components/memberships/member_table";

export default function Example() {
  const router = useRouter();

  const { slug } = useParams();
  

  const [memberships, setMemberships] = useState(null);
  const [members, setMembers] = useState(null); // State for members data
  const [error, setError] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        // Fetch organization's memberships
        const membershipsData = await fetchOrgMemBySlug(slug);
        setMemberships(membershipsData);
      } catch (err) {
        console.error("Failed to fetch memberships:", err);
        setError(err.message);
      }
    };

    if (slug) {
      fetchMemberships();
    }
  }, [slug]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Fetch organization's members
        const membersData = await fetchMembersBySlug(slug);
        setMembers(membersData);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError(err.message);
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
          setError(error);
          console.error(error);
        } else {
          setOrganization(data);
        }
      } catch (err) {
        console.error("Failed to fetch organization:", err);
        setError(err.message);
      }
    };

    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  const handleSubmitModal = async () => {
    try {
      // Fetch updated memberships data after modal submit
      const updatedMemberships = await fetchData(organization.organizationid);
      setMemberships(updatedMemberships);
    } catch (error) {
      console.error("Error updating memberships after modal submit:", error);
      setError(error.message);
    }
  };

  if (!memberships || !members || !organization) { // Check if either memberships or members are still loading
    return <div>Loading...</div>;
  }


  const handleCreateClick = () => {
    setShowModal(true);
  };

  if (!memberships || !members) {
    return <div>Loading...</div>;
  }



  console.log("These are the memberships:", memberships);
  console.log("These are the members:", members);

  return (
    <>
    <div className="mt-8 min-w-[1265px] ">
     
      <MembershipModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        organizationId={organization.organizationid}
        membership={undefined}
      />

       <MembershipTiers memberships={memberships} userID={undefined} onCreateClick={handleCreateClick}/>
{/* 
       <button
        onClick={handleCreateClick}
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300 ease-in-out"
      >
        Create New Membership
      </button> */}
       <MemberTable members={members} /> 
      </div>
    </>
  );
}
