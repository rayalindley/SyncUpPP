"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import { recordActivity } from "@/lib/track";
import debounce from "lodash/debounce";

interface JoinButtonProps {
  organizationId: string;
  organizationName: string;
  organizationAccess: "open" | "approval";
  initialMembershipStatus: "none" | "member" | "pending";
}

export default function JoinButton({
  organizationId,
  organizationName,
  organizationAccess,
  initialMembershipStatus,
}: JoinButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(initialMembershipStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleAction = useCallback(
    debounce(async () => {
      if (isLoading) return;
      setIsLoading(true);
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/signin");
        setIsLoading(false);
        return;
      }

      try {
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
      } catch (error) {
        console.error("Error performing action:", error);
        toast.error("An error occurred. Please try again.");
      } finally {
        setShowConfirmDialog(false);
        setIsLoading(false);
      }
    }, 300),
    [membershipStatus, organizationAccess, router]
  );

  const handleLeave = async (supabase: SupabaseClient, userId: string) => {
    setIsLoading(true);
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
      
      // Record activity for organization
      await recordActivity({
        organization_id: organizationId,
        activity_type: "LEAVE_ORGANIZATION",
        description: `A member left the organization`,
      });

      // Record activity for user
      await recordActivity({
        activity_type: "LEAVE_ORGANIZATION",
        description: `User left the organization: ${organizationName}`,
      });

      setMembershipStatus("none");
    }
    setIsLoading(false);
  };

  const handleCancelRequest = async (supabase: SupabaseClient, userId: string) => {
    setIsLoading(true);
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
      
      // Record activity for organization
      await recordActivity({
        organization_id: organizationId,
        activity_type: "CANCEL_JOIN_REQUEST",
        description: `A member cancelled their join request`,
      });

      // Record activity for user
      await recordActivity({
        activity_type: "CANCEL_JOIN_REQUEST",
        description: `User cancelled join request for: ${organizationName}`,
      });

      setMembershipStatus("none");
    }
    setIsLoading(false);
  };

  const handleJoin = async (supabase: SupabaseClient, userId: string) => {
    setIsLoading(true);
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
      
      // Record activity for organization
      await recordActivity({
        organization_id: organizationId,
        activity_type: "JOIN_ORGANIZATION",
        description: `A new member joined the organization`,
      });

      // Record activity for user
      await recordActivity({
        activity_type: "JOIN_ORGANIZATION",
        description: `User joined the organization: ${organizationName}`,
      });

      setMembershipStatus("member");
    }
    setIsLoading(false);
  };

  const handleJoinRequest = async (supabase: SupabaseClient, userId: string) => {
    setIsLoading(true);
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
      
      // Record activity for organization
      await recordActivity({
        organization_id: organizationId,
        activity_type: "SUBMIT_JOIN_REQUEST",
        description: `A new join request was submitted`,
      });

      // Record activity for user
      await recordActivity({
        activity_type: "SUBMIT_JOIN_REQUEST",
        description: `User submitted a join request for: ${organizationName}`,
      });

      setMembershipStatus("pending");
    }
    setIsLoading(false);
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
            className="rounded-lg bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setShowConfirmDialog(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-white ${
              membershipStatus === "member"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:bg-primarydark"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            onClick={handleAction}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Confirm"}
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
        } disabled:cursor-not-allowed disabled:opacity-50`}
        onClick={() => setShowConfirmDialog(true)}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : getButtonText()}
      </button>
      {mounted && showConfirmDialog && createPortal(<ConfirmDialog />, document.body)}
    </>
  );
}
