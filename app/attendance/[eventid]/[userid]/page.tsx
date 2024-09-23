"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/client";
import { getUserProfileById } from "@/lib/user_actions";
import { fetchEventById } from "@/lib/events";
import { check_permissions } from "@/lib/organization"; // Import the check_permissions function
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Preloader from "@/components/preloader";

const Attendance = () => {
  const { eventid, userid } = useParams() as { eventid: string, userid: string };
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUserPermissions = async () => {
      try {
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

        // Check user permissions using the check_permissions function
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
        const { data: userProfileData, error: userProfileError } = await getUserProfileById(userid);
        if (userProfileError) {
          toast.error(userProfileError.message);
          setLoading(false);
          return;
        }
        setUserProfile(userProfileData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (userid && eventid) {
      checkUserPermissions();
    }
  }, [userid, eventid, router]);

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

  // Function to mark attendance based on the parameters, e.g., marking "Present"
  const markAttendance = async () => {
    try {
      const { error } = await supabase
        .from("eventregistrations")
        .update({ attendance: "present" })
        .eq("userid", userid)
        .eq("eventid", eventid);

      if (error) {
        toast.error("Failed to mark attendance");
      } else {
        toast.success("Attendance marked successfully");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <>
      <ToastContainer />
      <div className="flex min-h-full flex-col justify-between bg-eerieblack px-6 py-12 lg:px-8">
        <div className="fixed top-10 text-gray-100 hover:cursor-pointer">
          <a onClick={() => router.back()} className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeftIcon className="h-5 w-5" /> Back
          </a>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center flex-grow">
          {/* Logo */}
          <img className="mx-auto mt-20 h-10 w-auto" src="/Symbian.png" alt="SyncUp" />
          <h2 className="mt-6 text-2xl font-bold leading-9 tracking-tight text-white">
            Attendance Check
          </h2>
          {/* Event Details */}
          {event && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold text-white">Event Details</h2>
              <p className="mt-2 text-sm text-gray-400">
              {format(new Date(event.starteventdatetime), "MMM d, yyyy h:mma")} -{" "}
              {format(new Date(event.endeventdatetime), "MMM d, yyyy h:mma")}
              </p>
            </div>
          )}

          {/* User Profile Details */}
          {userProfile && (
            <div className="mt-16 flex flex-col items-center text-white space-y-2">
              {userProfile.profilepicture ? (
                <img
                  src={`${supabaseStorageBaseUrl}/${userProfile.profilepicture}`}
                  alt="Profile"
                  className="h-36 w-36 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gray-500 text-4xl font-bold text-white">
                  {getInitials(userProfile.first_name ?? "", userProfile.last_name ?? "")}
                </div>
              )}
              <h3 className="text-2xl py-4 font-medium">
                {userProfile.first_name} {userProfile.last_name}
              </h3>
            </div>
          )}
        </div>

        {/* Mark Attendance Button */}
        <div className="flex items-center justify-center mb-4 sm:mx-auto sm:w-full sm:max-w-sm">
          <button
            onClick={markAttendance}
            className="mx-16 btn btn-primary w-full rounded-md bg-primary px-4 py-2 text-base font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Mark as Present
          </button>
        </div>
      </div>
    </>
  );
};

export default Attendance;
