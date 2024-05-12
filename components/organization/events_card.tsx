"use client";
import { countRegisteredUsers } from "@/lib/events";
import { createClient, getUser } from "@/lib/supabase/client";
import { Dialog, Transition } from "@headlessui/react";
import {
  BanknotesIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

const EventsCard = ({ event }) => {
  const {
    eventid,
    imageUrl,
    title,
    description,
    registrationfee,
    location,
    eventdatetime,
    capacity,
  } = event;
  const hasImageUrl = !!imageUrl; // Check if imageUrl is provided
  const truncatedDescription =
    description.length > 250 ? `${description.slice(0, 245)}...` : description;

  // State for managing Dialog visibility
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Function to open the Dialog
  const openDialog = () => setIsDialogOpen(true);

  // Function to close the Dialog
  const closeDialog = () => setIsDialogOpen(false);

  const formattedDateTime = (utcDateString) => {
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
  const eventDateTimePST = formattedDateTime(eventdatetime);

  // Determine the content for the registration tag
  const registrationTagContent =
    registrationfee && parseFloat(registrationfee) !== null
      ? `Php ${registrationfee}`
      : "Free";

  // Determine the content for the location tag
  const locationTagContent =
    location && location.startsWith("http") ? "Virtual" : "On-Site";

  // Define the base URL for your Supabase storage bucket
  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public";

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
      setRegisteredCount(count);
    }
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

  return (
    <>
      <div className="mb-4 flex max-h-96 flex-col overflow-hidden rounded-lg bg-raisinblack shadow-lg lg:w-96">
        <div className="h-40 overflow-hidden">
          {hasImageUrl ? (
            <img
              src={`${supabaseStorageBaseUrl}/${imageUrl}`}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-white" />
          )}
        </div>
        <div className="flex flex-grow flex-col justify-between p-4">
          <div>
            <h3 className="text-lg font-semibold text-light">{title}</h3>
            <p className="mt-2 text-justify text-sm text-light">{truncatedDescription}</p>
          </div>
          <div className="mt-3 flex items-center">
            <div className="mr-2 rounded-lg bg-charleston px-2 py-1 text-sm font-semibold text-white ring-1 ring-primary">
              {registrationTagContent}
            </div>
            <div className="rounded-lg bg-charleston px-2 py-1 text-sm font-semibold text-white ring-1 ring-primary">
              {locationTagContent}
            </div>
            <button
              className="ml-auto rounded bg-primary px-4 py-2 font-semibold text-white hover:bg-primarydark focus:outline-none"
              onClick={openDialog}
            >
              View
            </button>
          </div>
        </div>
      </div>
      <Transition.Root show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeDialog}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-4xl transform overflow-hidden bg-eerieblack p-8 text-left shadow-xl transition-all">
                  <div className="m-4 flex h-full flex-col justify-between">
                    <div>
                      <div className="flex justify-center">
                        {hasImageUrl ? (
                          <img
                            src={`${supabaseStorageBaseUrl}/${imageUrl}`}
                            alt={title}
                            className="max-h-80 w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-80 w-full bg-white" />
                        )}
                      </div>
                      <h2 className="mb-4 mt-4 text-2xl font-bold text-light">{title}</h2>
                      <div className="flex items-center text-sm text-light">
                        <ClockIcon
                          className="mr-2 h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                        {eventDateTimePST}
                        <MapPinIcon
                          className="ml-4 mr-2 h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                        {location}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-light">
                        <BanknotesIcon
                          className="mr-2 h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                        {registrationTagContent}
                        <UserGroupIcon
                          className="ml-10 mr-2 h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                        {attendeesDisplay}
                      </div>
                      <p className="mt-4 text-justify text-light">{description}</p>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <button
                        className="rounded bg-primary px-4 py-2 text-white hover:bg-primarydark"
                        onClick={handleEventRegistration}
                      >
                        Join Event
                      </button>
                    </div>
                    <button className="absolute right-0 top-0 m-4" onClick={closeDialog}>
                      <XMarkIcon className="h-6 w-6 text-light" />
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default EventsCard;
