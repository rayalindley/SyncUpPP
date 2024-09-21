"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/client";
import { getUserProfileById } from "@/lib/user_actions";
import { fetchEventById } from "@/lib/events";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Preloader from "@/components/preloader";

const Attendance = () => {
  const { eventid, userid } = useParams() as { eventid: string, userid: string };
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [event, setEvent] = useState<any | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAdminPermissions = async () => {
      try {
        const { user } = await getUser();

        if (!user) {
          toast.error("User not logged in");
          router.push("/signin");
          return;
        }

        // Check if the logged-in user is the admin of the event
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("adminid")
          .eq("eventid", eventid)
          .single();

        if (eventError || !event) {
          toast.error("Event not found");
          return;
        }

        if (event.adminid !== user.id) {
          toast.error("You do not have permissions to update attendance.");
          return;
        }

        setIsAdmin(true);

        // Fetch event details
        const { data: eventDetails, error: eventDetailsError } = await fetchEventById(eventid);
        if (eventDetailsError) {
          toast.error(eventDetailsError.message);
          return;
        }
        setEvent(eventDetails);

        // Fetch user profile
        const { data: userProfileData, error: userProfileError } = await getUserProfileById(userid);
        if (userProfileError) {
          toast.error(userProfileError.message);
          return;
        }
        setUserProfile(userProfileData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred. Please try again.");
      }
    };

    if (userid && eventid) {
      checkAdminPermissions();
    }
  }, [userid, eventid, router]);

  if (!isAdmin) {
    toast.error("You do not have permissions to update attendance.");
    return <Preloader />;
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
    <ToastContainer/>
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
            <h2 className="text-2xl font-bold text-white">{event.title}</h2>
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
      <div className="flex items-center justify-center  mb-4 sm:mx-auto sm:w-full sm:max-w-sm">
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
