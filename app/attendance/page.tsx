// pages/attendance.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/client";
import { check_permissions } from "@/lib/organization";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Preloader from "@/components/preloader";
import { Dialog } from "@headlessui/react";
import { format } from "date-fns";
import QrScannerComponent from "@/components/qrscanner"; // Import the updated QrScanner component

const Attendance = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventid = searchParams?.get("event");
  const userid = searchParams?.get("uid");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false); // State to toggle QR scanner
  const supabase = createClient();

  useEffect(() => {
    const markAttendance = async () => {
      try {
        if (!userid || !eventid) {
          toast.error("Invalid URL parameters.");
          router.push("/"); // Redirect to a safe page
          return;
        }

        const { user } = await getUser();

        if (!user) {
          toast.error("User not logged in");
          router.push("/signin");
          return;
        }

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("eventid", eventid)
          .single();

        if (eventError || !eventData) {
          toast.error("Event not found");
          setLoading(false);
          return;
        }
        setEvent(eventData);

        // Check user permissions
        const permission = await check_permissions(
          user.id,
          eventData.organizationid,
          "manage_event_registrations"
        );

        if (!permission) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        setHasPermission(true);

        // Fetch user profile
        const { data: userProfileData, error: userProfileError } = await supabase
          .from("userprofiles")
          .select("*")
          .eq("userid", userid)
          .single();

        if (userProfileError || !userProfileData) {
          toast.error("User profile not found");
          setLoading(false);
          return;
        }
        setUserProfile(userProfileData);

        // Mark attendance
        const { error } = await supabase
          .from("eventregistrations")
          .update({ attendance: "present" })
          .eq("userid", userid)
          .eq("eventid", eventid);

        if (error) {
          toast.error("Failed to mark attendance");
        } else {
          setShowSuccessModal(true);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    markAttendance();
  }, [userid, eventid, router]);

  // Handle the result from the QR scanner
  const handleQrScan = async (scannedResult: string) => {
    try {
      // Extract the user ID and event ID from the scanned QR code URL
      const url = new URL(scannedResult);
      const scannedUserId = url.searchParams.get("uid");
      const scannedEventId = url.searchParams.get("event");

      if (scannedUserId && scannedEventId) {
        // Redirect to the attendance page with the scanned user ID and event ID
        router.push(`/attendance?uid=${scannedUserId}&event=${scannedEventId}`);
      } else {
        toast.error("Invalid QR code.");
      }
    } catch (error) {
      console.error("QR Code processing error:", error); // Log QR processing error
      toast.error("Failed to process the scanned QR code.");
    }
  };

  // Handle errors from the QR scanner
  const handleQrError = (error: Error) => {
    console.error("QR Scan Error:", error);
  };

  if (loading) {
    return <Preloader />;
  }

  if (!hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Event Attendance</h1>
          <p className="text-lg">
            You do not have permission to update attendance for this event.
          </p>
        </div>
      </div>
    );
  }

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <>
      <ToastContainer />
      <div className="flex min-h-full flex-col justify-between bg-eerieblack px-6 py-12 lg:px-8">
        {/* Centering the Scan Again button */}
        <div className="flex flex-col items-center justify-center h-screen bg-eerieblack px-6 py-12 lg:px-8">
        {/* Logo */}
        <img className="h-10 w-auto mb-6" src="/syncup.png" alt="SyncUp" />
        
        {/* Success message */}
        <h2 className="text-3xl font-bold text-white mb-6">
          Attendance Check
        </h2>
        {/* Centered Scan Again button */}
        <button
          onClick={() => {
            setShowSuccessModal(false);
            setShowQrScanner(true); // Open the QR scanner
          }}
          className="mt-2 block w-40 rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark"
        >
          Scan QR
        </button>
      </div>
        
        {/* Success Modal */}
        <Dialog
          open={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
        >
          <div className="bg-raisinblack p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center flex-grow">
              <img className="mx-auto h-10 w-auto" src="/syncup.png" alt="SyncUp" />
              <h2 className="mt-4 text-3xl font-bold leading-9 tracking-tight text-white">
                Success!
              </h2>
              {userProfile && (
                <div className="mt-4 flex flex-col items-center text-white">
                  {userProfile.profilepicture ? (
                    <img
                      src={`${supabaseStorageBaseUrl}/${userProfile.profilepicture}`}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-500 text-3xl font-bold text-white">
                      {getInitials(userProfile.first_name ?? "", userProfile.last_name ?? "")}
                    </div>
                  )}
                  <p className="text-xl pt-2 font-medium">
                    {userProfile.first_name} {userProfile.last_name}
                  </p>
                  <p className="text-xs">has been marked as present for this event.</p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setShowQrScanner(true); // Open the QR scanner
              }}
              className="mt-4 block w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark"
            >
              Scan Another
            </button>
          </div>
        </Dialog>

        {/* QR Scanner Modal */}
        {showQrScanner && (
          <Dialog
            open={showQrScanner}
            onClose={() => setShowQrScanner(false)}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
          >
            <div className="bg-raisinblack p-6 rounded-lg shadow-lg max-w-md mx-auto w-full h-auto">
              <h2 className="text-light text-lg font-semibold mb-4 text-center">Scan QR for Attendance</h2>
              <QrScannerComponent
                onScan={handleQrScan}
                onError={handleQrError}
              />
              <button
                onClick={() => setShowQrScanner(false)}
                className="mt-4 block w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primarydark"
              >
                Close Scanner
              </button>
            </div>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default Attendance;
