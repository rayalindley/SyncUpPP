"use client";
import FeedbackFormAttendees from "@/components/feedback_form_attendees";
import Preloader from "@/components/preloader";
import { check_permissions, fetchOrganizationBySlug } from "@/lib/organization";
import { getUser } from "@/lib/supabase/client";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { checkIfRegisteredUser, hasSubmittedResponse } from "@/lib/feedback";
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import { getEventBySlug } from "@/lib/events";

export default function AttendeesFeedbackPage() {
  const router = useRouter();
  const params = useParams() as { slug: string };
  const slug = params.slug;
  const [ userId, setUserId ] = useState<string | null>(null);
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>();

  const [event, setEvent] = useState<any>();

  useEffect(() => {
    const fetchOrganization = async () => {
      if (typeof slug !== "string") {
        setError("Invalid slug type");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await fetchOrganizationBySlug(slug);
        if (error) {
          setError(error.message);
          console.error(error);
        } else {
          setOrganization(data);
        }
      } catch (err) {
        console.error("Failed to fetch organization:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    const checkPermissions = async () => {
      const { user } = await getUser();
      setUserId(user?.id ?? null);

      try {
        if (!user?.id) return setIsRegistered(false);

        const registered = await checkIfRegisteredUser(user.id, slug);
        setIsRegistered(registered);
      } catch (error) {
        console.error("Failed to check permissions", error);
      } finally {
        setLoading(false);
      }
    };

    const checkSubmissions = async() => {
      const { user } = await getUser();
      if(!user?.id) return;

      const submitted = await hasSubmittedResponse(user.id, slug);
      setHasSubmitted(submitted);
    };

    const fetchEvent = async () => {
      const { data, error } = await getEventBySlug(slug);
      if (data) {
        setEvent(data);
      }

      console.log("event:", data);
    };


    if(slug) {
      fetchOrganization();
      fetchEvent();
      checkPermissions();
      checkSubmissions();
    }
  }, [slug]);

  if (loading) {
    return <Preloader />;
  }

  if(!isRegistered) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-lg"> {`${event.title} Feedback Form`}</h1>
          <h1 className="mb-4 text-3xl"> Access Denied </h1>
          <p className="text-lg">
            You are not registered for this event.
          </p>
        </div>
      </div>
    );
  }
  
  if(hasSubmitted) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        
        <div className="text-center">
          <h1 className="mb-4 text-lg"> {`${event.title} Feedback Form`}</h1>
          <h1 className="mb-4 text-3xl"> You have already been submitted. </h1>
          <p className="text-lg">
            Only one response per person.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center bg-eerieblack px-6 py-12 lg:px-8">
        <div className="fixed top-10 text-gray-100 hover:cursor-pointer">
          <a
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <ArrowLeftIcon className="h-5 w-5" /> Back
          </a>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img className="mx-auto h-10 w-auto" src="/syncup.png" alt="SyncUp" />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
            {`${event?.title ?? ""}`}
          </h2>

          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-white"> Feedback Form </h2>
        </div>

        

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
          <FeedbackFormAttendees slug={slug} userId={userId}/>
        </div>
      </div>
    </>
  );
}
