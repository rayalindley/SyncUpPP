"use client";
import { countRegisteredUsers } from "@/lib/events";
import { createClient, getUser } from "@/lib/supabase/client";
import { Event } from "@/lib/types";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

const EventsCard = ({ event }: { event: Event }) => {
  const {
    eventid,
    imageUrl,
    title,
    description,
    registrationfee,
    location,
    eventdatetime,
    capacity,
    eventslug,
  } = event;
  const hasImageUrl = !!imageUrl; // Check if imageUrl is provided
  const truncatedDescription =
    description.length > 250 ? `${description.slice(0, 245)}...` : description;

  const router = useRouter(); // Next.js router for navigation

  const formattedDateTime = (utcDateString: string) => {
    // Create a Date object from the UTC date string
    const date = new Date(utcDateString);

    // Format the PST date
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Use this function to format your event.eventdatetime
  const eventDateTimePST = formattedDateTime(eventdatetime.toString());

  // Determine if the location is a URL and create a clickable link
  const locationContent =
    location && location.startsWith("http") ? "Virtual Event" : location;

  // Define the base URL for your Supabase storage bucket
  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  const handleEventRegistration = async () => {
    // Initialize Supabase client
    const supabase = createClient();

    // Confirmation dialog with SweetAlert
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, join the event!",
    });

    if (result.isConfirmed) {
      // Retrieve the current user's data
      const { user } = await getUser();
      const userId = user?.id;

      // Check if the user data is retrieved successfully
      if (!userId) {
        console.error("User not found");
        toast.error("User not found. Please log in.");
        return;
      }

      const { data, error } = await supabase.from("eventregistrations").insert([
        {
          eventid: event.eventid,
          // organizationmemberid: userId,
          registrationdate: new Date().toISOString(),
          status: "registered",
        },
      ]);

      if (error) {
        console.error("Registration failed:", error);
        toast.error("Registration failed. Please try again.");
      } else {
        console.log("Registration successful:", data);
        toast.success("You have successfully joined the event!");
        // Additional logic after successful registration (e.g., close dialog, show message)
      }
    }
  };

  // State to store the count of registered users
  const [registeredCount, setRegisteredCount] = useState(0);

  // Function to fetch and set the count of registered users
  const fetchRegisteredCount = async () => {
    const { count, error } = await countRegisteredUsers(event.eventid);
    if (error) {
      toast.error("Failed to fetch the number of registered users.");
      console.error("Error fetching registered count:", error);
    } else {
      setRegisteredCount(count ?? 0);
    }
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Format registration fee
  const formatFee = (fee: number) => {
    return fee && fee > 0 ? `Php ${parseFloat(fee.toString()).toFixed(2)}` : "Free";
  };

  // Determine the display text for the number of attendees
  const attendeesDisplay =
    event.capacity > 0
      ? `${registeredCount} attendees / ${event.capacity}`
      : `${registeredCount} attendees`;

  // Call fetchRegisteredCount when the component mounts
  useEffect(() => {
    fetchRegisteredCount();
  }, []);

  const handleCardClick = () => {
    router.push(`/e/${event.eventslug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="mb-4 flex max-h-96 cursor-pointer flex-col overflow-hidden rounded-md bg-eerieblack  transition duration-100 hover:scale-[1.01] hover:bg-raisinblack
      lg:w-72"
    >
      <div className="h-40 overflow-hidden">
        {imageUrl ? (
          <img
            src={`${supabaseStorageBaseUrl}/${imageUrl}`}
            alt={title}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <div className="h-full w-full bg-white" />
        )}
      </div>
      <div className="flex flex-grow flex-col justify-between p-4 text-left">
        <div>
          <h3 className="text-lg font-semibold text-light">{title}</h3>
          <p className="mt-2 text-sm text-light">
            {formatDate(eventdatetime.toString())}
          </p>
          <p className="text-sm text-light">{locationContent}</p>
          <p className="mt-2 text-sm font-medium text-light">
            {formatFee(registrationfee)}
          </p>
        </div>
        <div className="mt-3 flex items-center text-sm text-light">
          <UserGroupIcon className="mr-2 h-5 w-5 text-primary" aria-hidden="true" />
          <span>{registeredCount} attendees</span>
        </div>
      </div>
    </div>
  );
};

export default EventsCard;
