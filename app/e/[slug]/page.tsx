"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Preloader from "@/components/preloader";
import {
  checkEventPrivacyAndMembership,
  checkMembership,
  checkUserRegistration,
  countRegisteredUsers,
  isEventFull,
  registerForEvent,
  unregisterFromEvent,
} from "@/lib/events";
import { createClient, getUser } from "@/lib/supabase/client";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MapPinIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import remarkGfm from "remark-gfm";
import Swal from "sweetalert2";
import { Invoice as InvoiceClient, Xendit } from "xendit-node";
import type { CreateInvoiceRequest, Invoice } from "xendit-node/invoice/models";

const xenditClient = new Xendit({
  secretKey: process.env.NEXT_PUBLIC_XENDIT_SECRET_KEY!,
});
const { Invoice } = xenditClient;

const xenditInvoiceClient = new InvoiceClient({
  secretKey: process.env.NEXT_PUBLIC_XENDIT_SECRET_KEY!,
});

const EventPage = () => {
  const router = useRouter();
  const params = useParams() as { slug: string };
  const slug = params.slug;
  const [event, setEvent] = useState<Event | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [eventFull, setEventFull] = useState(false);
  const [isOrgMember, setIsOrgMember] = useState(false);
  const [eventFinished, setEventFinished] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);

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

        if (eventData) {
          const { count } = await countRegisteredUsers(eventData.eventid);
          setAttendeesCount(count ?? 0);

          if (eventData.capacity) {
            const { isFull } = await isEventFull(eventData.eventid);
            setEventFull(isFull);
          }
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
          setIsMember(isMember);
        }

        if (user && eventData) {
          const { isMember } = await checkMembership(user.id, eventData.organizationid);
          setIsOrgMember(isMember);
          // console.log("isMember", isMember);
        }

        // Check if the event is finished or registration is closed
        const now = new Date();
        if (new Date(eventData.endeventdatetime) < now) {
          setEventFinished(true);
        } else if (new Date(eventData.starteventdatetime) <= now) {
          setRegistrationClosed(true);
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
    return <Preloader />;
  }

  if (!event) {
    return <div>Event not found.</div>;
  }

  const handleEventRegistration = async () => {
    if (isRegistered || !isMember) return;

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
      const { user } = await getUser();
      const userId = user?.id;

      if (!userId) {
        console.error("User not found");
        toast.error("User not found. Please log in.");
        return;
      }

      // Check if the event registration is free or paid
      if (event.registrationfee > 0) {
        try {
          // Create Xendit invoice

          const data: CreateInvoiceRequest = {
            amount: event.registrationfee,
            payerEmail: user.email,
            externalId: `${event.eventid}-${event.title}-${new Date().toISOString()}`,
            description: `${organization?.name} Registration fee for ${event.title}: ${event.description}`,
            successRedirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/e/${event.eventslug}`,
          };

          const invoice: Invoice = await xenditInvoiceClient.createInvoice({
            data,
          });

          // Insert payment data into the payments table
          const { error: paymentError } = await supabase.from("payments").insert([
            {
              amount: event.registrationfee,
              invoiceId: invoice.id,
              type: "events",
              target_id: event.eventid,
              organizationId: event.organizationid,
              invoiceUrl: invoice.invoiceUrl,
              invoiceData: invoice,
            },
          ]);

          if (paymentError) {
            console.error("Error creating payment record:", paymentError);
            toast.error(`Registration failed: ${paymentError.message}`);
            return;
          }

          // Redirect to the invoice URL
          window.location.href = invoice.invoiceUrl;
        } catch (error) {
          console.error("Error creating invoice:", error);
          toast.error("Failed to create invoice. Please try again.");
        }
      } else {
        // Free registration
        const { data, error } = await registerForEvent(event.eventid, userId);

        if (error) {
          console.error("Registration failed:", error);
          toast.error(`Registration failed: ${error.message}`);
        } else {
          toast.success("You have successfully joined the event!");
          setIsRegistered(true);
          setAttendeesCount((prevCount) => prevCount + 1);

          if (event.capacity && attendeesCount + 1 >= event.capacity) {
            setEventFull(true);
          }
        }
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
        toast.success("You have successfully cancelled your registration!");
        setIsRegistered(false);
        setAttendeesCount((prevCount) => prevCount - 1);
        setEventFull(false);
      }
    }
  };

  const isUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  return (
    <div className="flex min-h-screen flex-col bg-eerieblack text-light">
      <Header user={user} />
      <ToastContainer />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 xl:px-0">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr,1.5fr]">
            <div className="space-y-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                {event.eventphoto ? (
                  <img
                    src={`${supabaseStorageBaseUrl}/${event.eventphoto}`}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-fadedgrey" />
                )}
                <span
                  className={`absolute right-2 top-2 rounded-full bg-opacity-75 px-2 py-1 text-xs font-medium shadow-2xl ${event.privacy === "public" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                >
                  {event.privacy === "public" ? "Public" : "Members only"}
                </span>
              </div>

              {organization && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {organization.photo ? (
                        <img
                          src={`${supabaseStorageBaseUrl}/${organization.photo}`}
                          alt={organization.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-white" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-light">Hosted By</p>
                        <Link href={`/${organization.slug}`}>
                          <p className="group flex items-center text-base font-semibold text-light hover:text-primary">
                            {organization.name}
                            <ChevronRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </p>
                        </Link>
                      </div>
                    </div>
                    {!isOrgMember && (
                      <button
                        className="rounded-full bg-primary px-4 py-2 text-sm text-white hover:bg-primarydark"
                        onClick={() => {
                          router.push(`/${organization.slug}?tab=membership`);
                        }}
                      >
                        Join Org
                      </button>
                    )}
                  </div>

                  <div
                    className={`relative ${showFullDescription ? "" : "group max-h-24 overflow-hidden"}`}
                  >
                    <p className="text-justify text-sm text-light">
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

              <hr className="border-t border-fadedgrey opacity-50" />

              {event.tags && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-light">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="cursor-pointer rounded-full bg-charleston px-3 py-2 text-sm text-light transition-colors duration-300 hover:bg-raisinblack"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-light sm:text-4xl lg:text-5xl">
                {event.title}
              </h1>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                  <span className="text-sm text-light sm:text-base">
                    {new Date(event.starteventdatetime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    ,{" "}
                    {new Date(event.starteventdatetime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                    &nbsp; - &nbsp;
                    {new Date(event.endeventdatetime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    ,{" "}
                    {new Date(event.endeventdatetime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                  {isUrl(event.location) ? (
                    <Link href={event.location}>
                      <p className="text-sm text-primary hover:underline sm:text-base">
                        Virtual Event
                      </p>
                    </Link>
                  ) : (
                    <span className="text-sm text-light sm:text-base">
                      {event.location}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                  <span
                    className={`text-sm sm:text-base ${attendeesCount >= event.capacity ? "text-red-500" : "text-light"}`}
                  >
                    {event.capacity > 0
                      ? `${attendeesCount} / ${event.capacity} attending`
                      : `${attendeesCount} attending`}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-raisinblack p-4 shadow-md">
                <h2 className="mb-2 text-lg font-medium text-light">Registration</h2>
                <p className="mb-4 text-sm text-light">
                  Hello! To join the event, please register below:
                </p>
                <p className="mb-4 text-light">
                  {event.registrationfee ? (
                    <>
                      <span>Registration Fee:</span> Php{" "}
                      {event.registrationfee.toFixed(2)}
                    </>
                  ) : (
                    "Free Registration"
                  )}
                </p>
                <button
                  className={`w-full rounded-md px-6 py-3 text-white ${
                    eventFinished ||
                    registrationClosed ||
                    (event.privacy === "private" && !isMember) ||
                    (eventFull && !isRegistered)
                      ? "cursor-not-allowed bg-fadedgrey"
                      : isRegistered
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-primary hover:bg-primarydark"
                  }`}
                  onClick={
                    isRegistered ? handleEventUnregistration : handleEventRegistration
                  }
                  disabled={
                    eventFinished ||
                    registrationClosed ||
                    (event.privacy === "private" && !isMember) ||
                    (eventFull && !isRegistered)
                  }
                >
                  {eventFinished
                    ? "Event Finished"
                    : registrationClosed
                      ? "Registration Closed"
                      : event.privacy === "private" && !isMember
                        ? "Event for Org Members Only"
                        : eventFull && !isRegistered
                          ? "Event Full"
                          : isRegistered
                            ? "Unregister"
                            : "Register"}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-light">Event Description</p>
                <hr className="border-t border-fadedgrey opacity-50" />
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {event.description}
                  </ReactMarkdown>
                </div>
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
