"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  checkEventPrivacyAndMembership,
  checkUserRegistration,
  registerForEvent,
  unregisterFromEvent,
} from "@/lib/events";
import { createClient, getUser } from "@/lib/supabase/client"; // Ensure you have this import for Supabase client
import { Event, Organization } from "@/lib/types";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import remarkGfm from "remark-gfm";
import Swal from "sweetalert2";

const EventPage = () => {
  const router = useRouter();
  const { slug } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { user } = await getUser();
      setUser(user);

      try {
        const supabase = createClient();
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("eventslug", slug)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        if (eventData?.organizationid) {
          const { data: organizationData, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("organizationid", eventData.organizationid)
            .single();

          if (orgError) throw orgError;
          setOrganization(organizationData);
        }

        if (eventData && user) {
          const { isRegistered } = await checkUserRegistration(
            eventData.eventid,
            user.id
          );
          setIsRegistered(isRegistered);

          const { isMember } = await checkEventPrivacyAndMembership(
            eventData.eventid,
            user.id
          );
          console.log(isMember);
          setIsMember(isMember);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found.</div>;
  }

  const handleEventRegistration = async () => {
    if (isRegistered || !isMember) return;
    // Confirmation dialog with SweetAlert
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to join the event?",
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

      if (!userId) {
        console.error("User not found");
        toast.error("User not found. Please log in.");
        return;
      }

      // Call the new registerForEvent function
      const { data, error } = await registerForEvent(event.eventid, userId);

      if (error) {
        console.error("Registration failed:", error);
        toast.error(`Registration failed: ${error.message}`);
      } else {
        console.log("Registration successful:", data);
        toast.success("You have successfully joined the event!");
        setIsRegistered(true);
      }
    }
  };

  const handleEventUnregistration = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to cancel your registration?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it!",
    });

    if (result.isConfirmed) {
      const { user } = await getUser();
      const userId = user?.id;

      if (!userId) {
        console.error("User not found");
        toast.error("User not found. Please log in.");
        return;
      }

      const { data, error } = await unregisterFromEvent(event.eventid, userId);

      if (error) {
        console.error("Unregistration failed:", error);
        toast.error(`Unregistration failed: ${error.message}`);
      } else {
        console.log("Unregistration successful:", data);
        toast.success("You have successfully cancelled your registration!");
        setIsRegistered(false); // Update the state to reflect the unregistration
      }
    }
  };

  // Define the base URL for your Supabase storage bucket
  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public";

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <ToastContainer />
      <main className="isolate mb-10 flex flex-1 justify-center pt-4 sm:px-4 md:px-6 lg:px-80">
        <div className="w-full max-w-screen-lg text-light">
          <div className="grid grid-cols-[2fr,3fr] gap-8 md:grid-cols-[1fr,1.5fr]">
            <div className="h-96 w-full">
              {event.eventphoto ? (
                <img
                  src={`${supabaseStorageBaseUrl}/${event.eventphoto}`}
                  alt={event.title}
                  className="h-96 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="h-96 w-full rounded-lg bg-white" />
              )}
              {organization && (
                <div className="mt-4">
                  <div className="flex items-center">
                    {organization.photo ? (
                      <img
                        src={`${supabaseStorageBaseUrl}/${organization.photo}`}
                        alt={organization.name}
                        className="mr-4 h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mr-4 h-10 w-10 rounded-full bg-white" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Hosted By</p>
                      <Link href={`/${organization.slug}`}>
                        <p className="text-md group flex items-center font-semibold hover:text-primary">
                          {organization.name}
                          <ChevronRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </p>
                      </Link>
                    </div>
                  </div>

                  <div
                    className={`relative ${showFullDescription ? "" : "group max-h-24 overflow-hidden"}`}
                  >
                    <p className="mt-3 text-justify text-sm">
                      {organization.description}
                    </p>
                    {!showFullDescription && organization.description.length > 130 && (
                      <>
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-eerieblack"></div>
                        <ChevronDownIcon
                          className="absolute bottom-0 left-1/2 h-5 w-5 -translate-x-1/2 transform cursor-pointer text-white opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => setShowFullDescription(true)}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
              <hr className="my-4 border-t border-fadedgrey opacity-50" />

              {/* Render tags if they exist */}
              {event.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <h3 className="w-full text-lg font-semibold">Tags</h3>
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="cursor-pointer rounded-full bg-charleston px-3 py-2 text-sm text-light transition-colors duration-300 hover:bg-raisinblack"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="">
              <h1 className="text-5xl font-bold">{event.title}</h1>
              <div className="mt-6 flex items-center text-base">
                <CalendarIcon className="mr-2 h-10 w-10 text-primary" />
                <div>
                  <span className="text-base font-medium">
                    {new Date(event.eventdatetime).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <br />
                  <span className="text-sm">
                    {new Date(event.eventdatetime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
              <p className="mb-4 flex items-center text-base">
                <MapPinIcon className="mr-2 h-10 w-10 text-primary" />
                {event.location}
              </p>

              <div className="rounded-lg bg-raisinblack p-1 shadow-md">
                <div className="rounded-t-lg bg-charleston px-4 py-2 text-light">
                  <h2 className="text-base font-medium">Registration</h2>
                </div>
                <p className="mt-2 px-6 text-sm text-light">
                  Hello! To join the event, please register below:
                </p>
                <div className="mt-2">
                  <p className="px-6 text-light">
                    <span>Registration Fee:</span>{" "}
                    {event.registrationfee
                      ? `Php ${event.registrationfee.toFixed(2)}`
                      : "Free"}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    className={`mt-8 w-full rounded-md px-6 py-3 text-white ${
                      event.privacy === "private" && !isMember
                        ? "cursor-not-allowed bg-fadedgrey"
                        : isRegistered
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-primary hover:bg-primarydark"
                    }`}
                    onClick={
                      isRegistered ? handleEventUnregistration : handleEventRegistration
                    }
                    disabled={event.privacy === "private" && !isMember}
                  >
                    {event.privacy === "private" && !isMember
                      ? "Event is available for Org Members only"
                      : isRegistered
                        ? "Unregister"
                        : "Register"}
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium text-light">Event Description</p>
                <hr className="my-2 border-t border-fadedgrey opacity-50" />
                <p className="whitespace-pre-wrap text-justify">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {event.description}
                  </ReactMarkdown>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventPage;
