"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import Loader from "@/components/Loader";
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
import remarkGfm from "remark-gfm";
import Swal from "sweetalert2";
import { Invoice as InvoiceClient, Xendit } from "xendit-node";
import { QRCode } from "react-qrcode-logo";
import Modal from "react-modal";
import { check_permissions } from "@/lib/organization";
import ShareButton from "@/components/share-button";

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
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQRCodeUrl] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [canManageRegistrations, setCanManageRegistrations] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [discountedFee, setDiscountedFee] = useState<number>(event?.registrationfee ?? 0);
  const [discountLabel, setDiscountLabel] = useState<string>("");

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  async function calculateDiscountedPrice(
    userId: string,
    organizationId: string
  ): Promise<{ discountedFee: number; discountLabel: string }> {
    if (!event || !discounts || discounts.length === 0) {
      return { discountedFee: event?.registrationfee ?? 0, discountLabel: "" };
    }

    let maxDiscount = 0;
    let discountLabel = "";

    try {
      const supabase = createClient();

      const { data: memberData, error: memberError } = await supabase
        .from("organization_members_roles")
        .select("role, membership_name")
        .eq("userid", userId)
        .eq("organizationid", organizationId);

      if (memberError || !memberData || memberData.length === 0) {
        return { discountedFee: event?.registrationfee ?? 0, discountLabel: "" };
      }

      discounts.forEach((discount) => {
        const hasRoleDiscount =
          discount.role?.includes("All Roles") ||
          (discount.role &&
            discount.role.some((role: string) => memberData.some((member) => member.role === role)));

        const hasMembershipDiscount =
          discount.membership_tier?.includes("All Membership Tiers") ||
          (discount.membership_tier &&
            discount.membership_tier.some((tier: string) =>
              memberData.some((m) => m.membership_name === tier)
            ));

        if (hasRoleDiscount || hasMembershipDiscount) {
          if (discount.discount_percent > maxDiscount) {
            maxDiscount = discount.discount_percent;
            discountLabel = hasMembershipDiscount
              ? discount.membership_tier?.includes("All Membership Tiers")
                ? "All Membership Tiers Discount"
                : `${discount.membership_tier.join(", ")} Discount`
              : discount.role?.includes("All Roles")
              ? "All Roles Discount"
              : `${discount.role.join(", ")} Discount`;
          }
        }
      });

      const discountedFee = event.registrationfee * ((100 - maxDiscount) / 100);
      return { discountedFee, discountLabel };
    } catch (error) {
      console.error("Error calculating discounted price:", error);
      return { discountedFee: event?.registrationfee ?? 0, discountLabel: "" };
    }
  }

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

    if (allowAllRoles && allowAllMemberships) return true;

    const hasValidRole =
      allowAllRoles || (roles.length > 0 && memberData.some((member) => roles.includes(member.role)));

    const hasValidMembership =
      allowAllMemberships ||
      (membershipTiers.length > 0 &&
        memberData.some((member) => membershipTiers.includes(member.membership_name)));

    if (roles.length === 0 && membershipTiers.length > 0) return hasValidMembership;
    if (membershipTiers.length === 0 && roles.length > 0) return hasValidRole;

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

        const { data: discountData, error: discountError } = await supabase
          .from("event_discounts")
          .select("*")
          .eq("eventid", eventData.id);

        if (discountError) throw discountError;
        if (discountData) setDiscounts(discountData);

        if (eventData?.organizationid) {
          const { data: organizationData, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("organizationid", eventData.organizationid)
            .single();

          if (orgError) throw orgError;
          setOrganization(organizationData);

          if (user) {
            const hasPermission = await check_permissions(
              user.id,
              eventData.organizationid,
              "manage_event_registrations"
            );
            setCanManageRegistrations(hasPermission);
          }
        }

        if (eventData) {
          const { count } = await countRegisteredUsers(eventData.id);
          setAttendeesCount(count ?? 0);

          if (eventData.capacity) {
            const { isFull } = await isEventFull(eventData.id);
            setEventFull(isFull);
          }
        }

        if (eventData && user) {
          const { isRegistered: localIsRegistered } = await checkUserRegistration(eventData.id, user.id);
          setIsRegistered(localIsRegistered);

          if (eventData.privacy?.type === "private") {
            const { roles, membership_tiers, allow_all_roles, allow_all_memberships } = eventData.privacy;

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

          if (localIsRegistered) {
            const { data: registrationData, error: registrationError } = await supabase
              .from("eventregistrations")
              .select("qr_code_data, attendance")
              .eq("userid", user.id)
              .eq("eventid", eventData.id)
              .limit(1)
              .maybeSingle();

            if (registrationError) {
              console.error("Error fetching registration data:", registrationError);
            } else if (registrationData) {
              if (registrationData.qr_code_data) setQRCodeUrl(registrationData.qr_code_data);
              setAttendanceStatus(registrationData.attendance);
            }
          }
        }

        if (user && eventData) {
          const { isMember } = await checkMembership(user.id, eventData.organizationid);
          setIsOrgMember(isMember);
        }

        const now = new Date();
        if (new Date(eventData.endeventdatetime) < now) setEventFinished(true);
        else if (new Date(eventData.starteventdatetime) <= now) setRegistrationClosed(true);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchData();
  }, [slug]);

  const isUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const generateAndSaveQRCode = async (userId: string, id: string) => {
    const { data: eventData, error } = await supabase
      .from("events")
      .select("location")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching event data:", error);
      return;
    }

    if (isUrl(eventData.location)) return;

    const qrCodeData = `${process.env.NEXT_PUBLIC_SITE_URL}/attendance?uid=${userId}&event=${id}`;

    await supabase
      .from("eventregistrations")
      .update({ qr_code_data: qrCodeData })
      .eq("userid", userId)
      .eq("eventid", id);

    setQRCodeUrl(qrCodeData);
    setShowQRCode(true);
  };

  useEffect(() => {
    async function checkAndGenerateQRCode() {
      if (user && isRegistered && event && !isUrl(event.location) && !qrCodeUrl) {
        if (user.id && event.id) await generateAndSaveQRCode(user.id, event.id);
      }
    }
    checkAndGenerateQRCode();
  }, [user, isRegistered, event, qrCodeUrl]);

  useEffect(() => {
    async function fetchDiscountedPrice() {
      if (user && event && discounts.length > 0) {
        const { discountedFee, discountLabel } = await calculateDiscountedPrice(user.id, event.organizationid);
        setDiscountedFee(discountedFee);
        setDiscountLabel(discountLabel);
      }
    }
    fetchDiscountedPrice();
  }, [user, event, discounts]);

  if (loading) return <Loader />;
  if (!event) return <div>Event not found.</div>;

  const redirectToRegistrations = () => {
    if (!organization?.slug || !event?.id) return;
    router.push(`/dashboard/${organization.slug}/registrations/${event.id}`);
  };

  // ... keep your existing registration/unregistration handlers as-is ...
  const handleEventRegistration = async () => { /* unchanged */ };
  const handleEventUnregistration = async () => { /* unchanged */ };

  return (
    <>
      {/* UI unchanged except uses redirectToRegistrations */}
      <div className="flex min-h-screen flex-col bg-eerieblack text-light">
        <Header user={user} />
        <ToastContainer />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 xl:px-0">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[1fr,1.5fr]">
              {/* LEFT / RIGHT content unchanged */}
              {/* In attendee count clickable span: onClick={canManageRegistrations ? redirectToRegistrations : undefined} */}
            </div>
          </div>
        </main>
        <Footer />
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="View QR Code"
          className="bg-eerieblack p-6 rounded-lg shadow-lg flex flex-col items-center justify-center"
          overlayClassName="fixed inset-0 bg-eerieblack bg-opacity-70 flex items-center justify-center"
        >
          <h2 className="text-2xl text-white mb-4">Your QR Code</h2>
          {qrCodeUrl ? <QRCode value={qrCodeUrl.trim()} size={200} qrStyle="dots" ecLevel="H" /> : <p className="text-light">Loading QR Code...</p>}
          <button className="mt-4 rounded-md bg-primary px-6 py-2 text-white hover:bg-primarydark" onClick={closeModal}>
            Close
          </button>
        </Modal>
      </div>
    </>
  );
};

export default EventPage;