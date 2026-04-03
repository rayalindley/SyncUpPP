"use client";
import FeedbackFormAttendees from "@/components/feedback_form_attendees";
import Loader from "@/components/Loader";
import { check_permissions, fetchOrganizationBySlug } from "@/lib/organization";
import { getUser } from "@/lib/supabase/client";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { checkIfRegisteredUser, hasSubmittedResponse } from "@/lib/feedback";
import { getEventBySlug } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

export default function AttendeesFeedbackPage() {
  const router = useRouter();
  const params = useParams() as { slug: string };
  const slug = params.slug;
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false); 
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  const [event, setEvent] = useState<any>();

  useEffect(() => {
    const fetchEventAndUser = async () => {
      if (typeof slug !== "string") {
        setError("Invalid slug type");
        setLoading(false);
        return;
      }

      try {
        const { user } = await getUser();
        setUserId(user?.id ?? null);
        
        let currentEvent = null;

        const { data: eventData, error: eventError } = await getEventBySlug(slug);
        if (eventData) {
          setEvent(eventData);
          currentEvent = eventData;
        } else if (eventError) {
          console.error("Error fetching event:", eventError);
        }

        if (user?.id) {
          if(currentEvent && currentEvent.organizationid) {
            const supabase = createClient();
            const { data: orgData } = await supabase
              .from('organizations')
              .select('adminid')
              .eq('organizationid', currentEvent.organizationid)
              .single();
              
            if(orgData && orgData.adminid === user.id) {
              setIsOrganizer(true);
            }
          }

          const registered = await checkIfRegisteredUser(user.id, slug);
          setIsRegistered(registered);

          const submitted = await hasSubmittedResponse(user.id, slug);
          setHasSubmitted(submitted);
        } else {
          setIsRegistered(false);
        }
      } catch (err) {
        console.error("Failed during data fetch:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEventAndUser();
    }
  }, [slug]);

  if (loading) {
    return <Loader />;
  }

  if (!isRegistered && !isOrganizer) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-lg">{event?.title ? `${event.title} Feedback Form` : "Feedback Form"}</h1>
          <h1 className="mb-4 text-3xl">Access Denied</h1>
          <p className="text-lg">
            You must be registered for this event to submit feedback.
          </p>
        </div>
      </div>
    );
  }

  if (hasSubmitted && !isOrganizer) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-lg">{event?.title ? `${event.title} Feedback Form` : "Feedback Form"}</h1>
          <h1 className="mb-4 text-3xl">Feedback Received</h1>
          <p className="text-lg">
            You have already submitted feedback for this event. Thank you!
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primarydark"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center bg-eerieblack px-6 py-12 lg:px-8">
        <div className="fixed top-10 left-10 text-gray-100 hover:cursor-pointer z-50">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <div className="h-5 w-5">
              <ArrowLeftIcon />
            </div>
            Back
          </button>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-sm mt-8">
          <img className="mx-auto h-10 w-auto" src="/syncup.png" alt="SyncUp" />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            {event?.title ? `${event.title} Feedback Form` : "Feedback Form"}
            {isOrganizer && <span className="ml-2 text-sm text-primary">(Preview Mode)</span>}
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg pointer-events-auto">
          <FeedbackFormAttendees slug={slug} userId={userId} />
        </div>
      </div>
    </>
  );
}