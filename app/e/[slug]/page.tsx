"use client";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Preloader from "@/components/preloader";
import {
  checkMembership,
  checkUserRegistration,
  countRegisteredUsers,
  isEventFull,
  registerForEvent,
  unregisterFromEvent,
} from "@/lib/events";
import { createClient, getUser } from "@/lib/supabase/client";
import { recordActivity } from "@/lib/track";
import { getUserProfileById } from "@/lib/user_actions";
import { User } from "@/node_modules/@supabase/auth-js/src/lib/types";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
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
import { QRCode } from "react-qrcode-logo";
import Modal from "react-modal"; // Import modal library

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
  const [canJoin, setCanJoin] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false); // State to show/hide QR code
  const [qrCodeUrl, setQRCodeUrl] = useState(""); // State for QR code URL
  const [modalIsOpen, setModalIsOpen] = useState(false); // State for modal visibility

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  async function checkUserRoleAndMembership(
    userId: string,
    organizationId: string,
    roles: string[],
    membershipTiers: string[],
    allowAllRoles: boolean,
    allowAllMemberships: boolean
  ): Promise<boolean> {
    const supabase = createClient();

    const { data: memberData, error: memberError } = await supabase
      .from("organization_members_roles")
      .select("role, membership_name")
      .eq("userid", userId)
      .eq("organizationid", organizationId);

    if (memberError || !memberData || memberData.length === 0) {
      return false;
    }

    if (allowAllRoles && allowAllMemberships) {
      return true;
    }

    const hasValidRole =
      allowAllRoles ||
      (roles.length > 0 && memberData.some((member) => roles.includes(member.role)));

    const hasValidMembership =
      allowAllMemberships ||
      (membershipTiers.length > 0 &&
        memberData.some((member) => membershipTiers.includes(member.membership_name)));

    if (roles.length === 0 && membershipTiers.length > 0) {
      return hasValidMembership;
    } else if (membershipTiers.length === 0 && roles.length > 0) {
      return hasValidRole;
    }

    return hasValidRole || hasValidMembership;
  }

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

          if (eventData.privacy?.type === "private") {
            const { roles, membership_tiers, allow_all_roles, allow_all_memberships } =
              eventData.privacy;

            const canUserJoin = await checkUserRoleAndMembership(
              user.id,
              eventData.organizationid,
              roles,
              membership_tiers,
              allow_all_roles,
              allow_all_memberships
            );

            setCanJoin(canUserJoin);
            setIsMember(true);
          } else {
            setIsMember(true);
          }

          // Check if a QR code exists for the user
          const { data: registrationData, error: registrationError } = await supabase
            .from("eventregistrations")
            .select("qr_code_data")
            .eq("userid", user.id)
            .eq("eventid", eventData.eventid)
            .single();

          if (registrationError) {
            console.error("Error fetching registration data:", registrationError);
          } else if (registrationData.qr_code_data) {
            setQRCodeUrl(registrationData.qr_code_data);
          }
        }

        if (user && eventData) {
          const { isMember } = await checkMembership(user.id, eventData.organizationid);
          setIsOrgMember(isMember);
        }

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

    
  const isUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
    // Helper function to generate and save QR code data
    const generateAndSaveQRCode = async (userId: string, eventId: string) => {
      // Fetch the event data to check if the location is a URL
      const { data: eventData, error } = await supabase
        .from("events")
        .select("location")
        .eq("eventid", eventId)
        .single();
    
      if (error) {
        console.error("Error fetching event data:", error);
        return;
      }
    
      // Check if the event location is a URL (indicating an online event)
      if (isUrl(eventData.location)) {
        console.log("Event is online. No QR code generation needed.");
        return; // Exit the function, no QR code generation needed
      }
    
      // Generate QR code data for in-person events
      const qrCodeData = `${process.env.NEXT_PUBLIC_SITE_URL}/attendance/${eventId}/${userId}`;
  
      await supabase
        .from("eventregistrations")
        .update({ qr_code_data: qrCodeData })
        .eq("userid", userId)
        .eq("eventid", eventId);
      setQRCodeUrl(qrCodeData);
      setShowQRCode(true);
    };
  // Add a new useEffect to check if QR code needs to be generated
  useEffect(() => {
    async function checkAndGenerateQRCode() {
      if (user && isRegistered && event && !isUrl(event.location) && !qrCodeUrl) {
        // User is registered, event is not virtual, and no QR code has been generated
        await generateAndSaveQRCode(user.id, event.eventid);
      }
    }

    checkAndGenerateQRCode();
  }, [user, isRegistered, event, qrCodeUrl]);

  if (loading) {
    return <Preloader />;
  }

  if (!event) {
    return <div>Event not found.</div>;
  }

  const handleEventRegistration = async () => {
    const userId = user?.id;
  
    if (isRegistered) return;
  
    if (!user) {
      toast.error("User not found. Please log in.");
      return;
    }
  
    if (eventFinished || registrationClosed || (eventFull && !isRegistered)) return;
  
    if (event.privacy.type === "private" && !isOrgMember) {
      toast.error("You need to be a member of the organization to register for this event.");
      return;
    }
  
    if (event.privacy.type === "private" && isOrgMember && !canJoin) {
      toast.error("You do not have the required role or membership tier to register for this event.");
      return;
    }
  
    if (eventFull && !isRegistered) {
      toast.error("The event is full.");
      return;
    }
  
    let fullName = `${user?.user_metadata?.first_name ?? ""} ${user?.user_metadata?.last_name ?? ""}`.trim();
    if (!fullName) {
      try {
        const { data: userProfile, error } = await getUserProfileById(user.id);
        if (error) {
          toast.error("Could not retrieve user profile information.");
          return;
        }
        fullName = `${userProfile?.first_name} ${userProfile?.last_name}`.trim();
      } catch (error) {
        toast.error("An error occurred while retrieving user profile information.");
        return;
      }
    }
  
    if (event.onsite) {
      // Onsite payment flow
      const result = await Swal.fire({
        title: "Choose Payment Method",
        icon: "question",
        input: "radio",
        inputOptions: {
          onsite: "Pay Onsite",
          offsite: "Pay Online",
        },
        inputValidator: (value) => {
          if (!value) {
            return "You need to choose a payment method!";
          }
        },
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Proceed",
      });
  
      if (result.isConfirmed) {
        const paymentMethod = result.value;
  
        if (paymentMethod === "onsite") {
          const { data, error } = await registerForEvent(event.eventid, user.id, paymentMethod);
  
          if (error) {
            toast.error(`Registration failed: ${error.message}`);
          } else {
            await recordActivity({
              activity_type: "event_register",
              description: `User registered for the event: ${event.title}`,
            });
  
            await recordActivity({
              activity_type: "event_register",
              organization_id: event.organizationid,
              description: `User ${fullName} registered for the event: ${event.title}`,
            });
  
            toast.success("You have successfully registered! Please proceed to the onsite payment area.");
            setPaymentPending(true); // Set payment pending state
            setIsRegistered(true);
            setAttendeesCount((prevCount) => prevCount + 1);
  
            if (event.capacity && attendeesCount + 1 >= event.capacity) {
              setEventFull(true);
            }
  
            // Generate QR code after successful registration if the event is not virtual
            if (!isUrl(event.location)) {
              await generateAndSaveQRCode(user.id, event.eventid); // Call QR code generation
            }
          }
        } else if (paymentMethod === "offsite") {
          // Online payment flow
          try {
            const data = {
              amount: event.registrationfee,
              payerEmail: user.email,
              externalId: `${event.eventid}-${event.title}-${new Date().toISOString()}`,
              description: `${organization?.name} Registration fee for ${event.title}: ${event.description}`,
              successRedirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/e/${event.eventslug}`,
            };
  
            const invoice = await xenditInvoiceClient.createInvoice({ data });
  
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
              toast.error(`Registration failed: ${paymentError.message}`);
              return;
            }
  
            // Navigate to the payment URL after QR code data is stored successfully
            await generateAndSaveQRCode(user.id, event.eventid); // Ensure QR Code is generated after registration
            window.location.href = invoice.invoiceUrl;
          } catch (error) {
            toast.error("An error occurred during registration. Please try again.");
          }
        }
      }
    } else {
      try {
        // Direct registration without onsite payment
        if (event.registrationfee > 0) {
          const data = {
            amount: event.registrationfee,
            payerEmail: user.email,
            externalId: `${event.eventid}-${event.title}-${new Date().toISOString()}`,
            description: `${organization?.name} Registration fee for ${event.title}: ${event.description}`,
            successRedirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/e/${event.eventslug}`,
          };
  
          const invoice = await xenditInvoiceClient.createInvoice({ data });
  
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
            toast.error(`Registration failed: ${paymentError.message}`);
            return;
          }
  
          // Generate QR code after successful registration if the event is not virtual
          await generateAndSaveQRCode(user.id, event.eventid); // Ensure QR Code is generated after registration
          window.location.href = invoice.invoiceUrl;
        } else {
          const { data, error } = await registerForEvent(event.eventid, user.id, "offsite");
  
          if (error) {
            toast.error(`Registration failed: ${error.message}`);
          } else {
            await recordActivity({
              activity_type: "event_register",
              description: `User registered for the event: ${event.title}`,
            });
  
            await recordActivity({
              activity_type: "event_register",
              organization_id: event.organizationid,
              description: `User ${fullName} registered for the event: ${event.title}`,
            });
  
            toast.success("You have successfully joined the event!");
            setIsRegistered(true);
            setAttendeesCount((prevCount) => prevCount + 1);
  
            if (event.capacity && attendeesCount + 1 >= event.capacity) {
              setEventFull(true);
            }
  
            // Generate QR code after successful registration if the event is not virtual
            await generateAndSaveQRCode(user.id, event.eventid);
          }
        }
      } catch (error) {
        toast.error("An error occurred during registration. Please try again.");
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
        toast.error("User not found. Please log in.");
        return;
      }

      const { data: userProfile, error } = await getUserProfileById(userId);

      if (error) {
        return;
      }
      const fullName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "";

      await recordActivity({
        activity_type: "event_unregister",
        description: `A User cancelled their registration for the event: ${event.title}`,
      });

      await recordActivity({
        activity_type: "event_unregister",
        organization_id: event.organizationid,
        description: `User ${fullName} cancelled their registration for the event: ${event.title}`,
      });

      const { data, error: unregisterError } = await unregisterFromEvent(event.eventid, userId);

      if (unregisterError) {
        toast.error(`Unregistration failed: ${unregisterError.message}`);
      } else {
        toast.success("You have successfully cancelled your registration!");
        setIsRegistered(false);
        setAttendeesCount((prevCount) => prevCount - 1);
        setEventFull(false);
        setQRCodeUrl(""); // Clear QR code on unregistration
        setShowQRCode(false); // Hide QR code on unregistration
      }
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
                  className={`absolute right-2 top-2 rounded-full bg-opacity-75 px-2 py-1 text-xs font-medium shadow-2xl ${
                    event.privacy.type === "public"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {event.privacy.type === "public" ? "Public" : "Members only"}
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

              {event.privacy?.type === "private" &&
                !event.privacy.allow_all_roles &&
                !event.privacy.allow_all_memberships && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-light">
                      Permitted Roles and Membership Tiers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {event.privacy.roles?.map((role) => (
                        <span
                          key={role}
                          className="cursor-pointer rounded-full bg-charleston px-3 py-2 text-sm text-light transition-colors duration-300 hover:bg-raisinblack"
                        >
                          {role}
                        </span>
                      ))}
                      {event.privacy.membership_tiers?.map((tier) => (
                        <span
                          key={tier}
                          className="cursor-pointer rounded-full bg-charleston px-3 py-2 text-sm text-light transition-colors duration-300 hover:bg-raisinblack"
                        >
                          {tier}
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
                    isRegistered ? (
                      <Link href={event.location}>
                        <p className="text-sm text-primary hover:underline sm:text-base">
                          Virtual Event
                        </p>
                      </Link>
                    ) : (
                      <span className="text-sm text-light sm:text-base">
                        Virtual Event (register to access event link)
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-light sm:text-base">
                      {event.location}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
                  <span
                    className={`text-sm sm:text-base ${
                      attendeesCount >= event.capacity ? "text-red-500" : "text-light"
                    }`}
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
                    (eventFull && !isRegistered)
                  }
                >
                  {eventFinished
                    ? "Event Finished"
                    : registrationClosed
                    ? "Registration Closed"
                    : eventFull && !isRegistered
                    ? "Event Full"
                    : isRegistered
                    ? "Unregister"
                    : "Register"}
                </button>
                {isRegistered && qrCodeUrl && !eventFinished && (
                  <button
                    className="w-full mt-4 rounded-md bg-primary px-6 py-3 text-white hover:bg-primarydark"
                    onClick={openModal}
                  >
                    View QR
                  </button>
                )}
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
      {/* Modal for QR Code */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="View QR Code"
        className="bg-eerieblack p-6 rounded-lg shadow-lg flex flex-col items-center justify-center"
        overlayClassName="fixed inset-0 bg-eerieblack bg-opacity-70 flex items-center justify-center"
      >
        <h2 className="text-2xl text-white mb-4">Your QR Code</h2>
        {qrCodeUrl ? (
          <QRCode
            value={qrCodeUrl.trim()}
            size={200}
            qrStyle="dots"
            ecLevel="H"
          />
        ) : (
          <p className="text-light">Loading QR Code...</p> // Loading message when qrCodeUrl is not available
        )}
        <p className="mt-2 text-light text-center">Please save this QR Code and present it at the event for your attendance.</p>
        <button
          className="mt-4 rounded-md bg-primary px-6 py-2 text-white hover:bg-primarydark"
          onClick={closeModal}
        >
          Close
        </button>
      </Modal>

    </div>
  );
};

export default EventPage;
