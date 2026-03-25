"use client";
import FeedbackFormOrganizer from "@/components/feedback_form_organizers";
import Preloader from "@/components/preloader";
import { getUser } from "@/lib/supabase/client";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrganizersFeedbackPage() {
  const router = useRouter();
  const params = useParams() as { slug: string };
  const slug = params.slug;
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await getUser();
        setUserId(user?.id ?? null);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchUser();
    }
  }, [slug]);

  if (loading) {
    return <Preloader />;
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
            Form Builder
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg pointer-events-auto">
          <FeedbackFormOrganizer selectedEvent={slug} userId={userId} />
        </div>
      </div>
    </>
  );
}