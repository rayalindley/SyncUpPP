"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

interface JoinButtonProps {
  organizationId: string;
  organizationAccess: "open" | "approval";
  initialMembershipStatus: "none" | "member" | "pending";
}

export default function JoinButton({
  organizationId,
  organizationAccess,
  initialMembershipStatus,
}: JoinButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(initialMembershipStatus);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleAction = async () => {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/signin");
      return;
    }

    switch (membershipStatus) {
      case "member":
        await handleLeave(supabase, user.id);
        break;
      case "pending":
        await handleCancelRequest(supabase, user.id);
        break;
      case "none":
        if (organizationAccess === "open") {
          await handleJoin(supabase, user.id);
        } else {
          await handleJoinRequest(supabase, user.id);
        }
        break;
    }

    setShowConfirmDialog(false);
  };

  const handleLeave = async (supabase: SupabaseClient, userId: string) => {
    const { error } = await supabase
      .from("organizationmembers")
      .delete()
      .eq("organizationid", organizationId)
      .eq("userid", userId);

    if (error) {
      console.error("Error leaving organization:", error);
      toast.error("Failed to leave the organization. Please try again.");
    } else {
      toast.success("Successfully left the organization!");
      setMembershipStatus("none");
    }
  };

  const handleCancelRequest = async (supabase: SupabaseClient, userId: string) => {
    const { error } = await supabase
      .from("organization_requests")
      .delete()
      .eq("org_id", organizationId)
      .eq("user_id", userId)
      .eq("status", "pending");

    if (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel the request. Please try again.");
    } else {
      toast.success("Request cancelled successfully!");
      setMembershipStatus("none");
    }
  };

  const handleJoin = async (supabase: SupabaseClient, userId: string) => {
    const { error } = await supabase.from("organizationmembers").insert([
      {
        organizationid: organizationId,
        userid: userId,
        joindate: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error joining organization:", error);
      toast.error("Failed to join the organization. Please try again.");
    } else {
      toast.success("Successfully joined the organization!");
      setMembershipStatus("member");
    }
  };

  const handleJoinRequest = async (supabase: SupabaseClient, userId: string) => {
    const { error } = await supabase.from("organization_requests").insert([
      {
        org_id: organizationId,
        user_id: userId,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("Error submitting join request:", error);
      toast.error("Failed to submit join request. Please try again.");
    } else {
      toast.success("Join request submitted successfully!");
      setMembershipStatus("pending");
    }
  };

  const getButtonText = () => {
    switch (membershipStatus) {
      case "member":
        return "Leave";
      case "pending":
        return "Cancel Request";
      case "none":
        return organizationAccess === "open" ? "Join" : "Request to Join";
    }
  };

  const ConfirmDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">Confirm {getButtonText()}</h2>
        <p>Are you sure you want to {getButtonText().toLowerCase()} this organization?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-lg bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
            onClick={() => setShowConfirmDialog(false)}
          >
            Cancel
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-white ${
              membershipStatus === "member"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:bg-primarydark"
            }`}
            onClick={handleAction}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        className={`rounded-lg px-4 py-2 text-white ${
          membershipStatus === "member"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-primary hover:bg-primarydark"
        }`}
        onClick={() => setShowConfirmDialog(true)}
      >
        {getButtonText()}
      </button>
      {mounted && showConfirmDialog && createPortal(<ConfirmDialog />, document.body)}
    </>
  );
}
