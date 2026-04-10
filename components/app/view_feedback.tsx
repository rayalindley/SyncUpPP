"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { createClient } from "@/lib/supabase/client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
}) as any;

const supabase = createClient();

interface FormResponse {
  id: string;
  comment: string;
  submitted_at: string;
}

export default function FeedbackTable({
  eventSlug,
  userId,
}: {
  eventSlug: string;
  userId: string;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Event Details & Individual Feedbacks
  useEffect(() => {
    const fetchEventAndFeedback = async () => {
      setLoading(true);

      // Fetch event by slug
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("eventslug", eventSlug)
        .single();

      if (eventData) {
        setEvent(eventData);

        // Fetch form associated with the event
        const { data: formData } = await supabase
          .from("forms")
          .select("id")
          .eq("event_id", eventData.id) // CHANGED from eventData.eventid to eventData.id
          .single();

        if (formData) {
          // Fetch all responses for this form
          const { data: responsesData, error: responsesError } = await supabase
            .from("form_responses")
            .select("id, comment, submitted_at")
            .eq("form_id", formData.id)
            .order("submitted_at", { ascending: false });

          if (responsesData) {
            setFeedbacks(responsesData);
          }
        }
      } else {
        toast.error("Event not found.");
      }
      setLoading(false);
    };

    fetchEventAndFeedback();
  }, [eventSlug]);

  // 2. Define Table Columns for Feedback
  const columns = [
    {
      name: "Date Submitted",
      selector: (row: FormResponse) => row.submitted_at,
      sortable: true,
      width: "250px",
      cell: (row: FormResponse) =>
        new Date(row.submitted_at).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: 'numeric', hour12: true
        }),
    },
    {
      name: "Feedback / Comment",
      selector: (row: FormResponse) => row.comment,
      sortable: true,
      wrap: true, // Allows long comments to wrap instead of being hidden
      cell: (row: FormResponse) => (
        <div className="py-3 whitespace-pre-wrap">
          {row.comment ? row.comment : <span className="text-gray-500 italic">No comment provided</span>}
        </div>
      ),
    }
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="flex flex-col space-y-4">
        <div className="text-gray-100 hover:cursor-pointer mb-4">
          <a
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:opacity-80 font-bold"
          >
            <ArrowLeftIcon className="h-5 w-5" /> Back
          </a>
        </div>
        <div>
          <h1 className="text-base font-semibold leading-6 text-light text-xl">
            {event?.title ? `${event.title} - Individual Feedbacks` : "Loading Event..."}
          </h1>
          <p className="mt-2 text-sm text-light">
            A list of all individual responses and comments submitted by attendees.
          </p>
        </div>
      </div>

      <div className="mt-8 hidden sm:block">
        <DataTable
          columns={columns}
          data={feedbacks}
          pagination
          progressPending={loading}
          customStyles={{
            header: { style: { backgroundColor: "rgb(36, 36, 36)", color: "white" } },
            rows: { style: { backgroundColor: "rgb(33, 33, 33)", color: "white" } },
            headCells: { style: { backgroundColor: "rgb(36, 36, 36)", color: "white" } },
            cells: { style: { backgroundColor: "rgb(33, 33, 33)", color: "white" } },
            pagination: { style: { backgroundColor: "rgb(33, 33, 33)", color: "white" } },
          }}
          highlightOnHover
          noDataComponent={<div className="p-4 text-white">No feedbacks submitted yet.</div>}
        />
      </div>

      {/* Mobile View */}
      <div className="mt-8 block sm:hidden">
        {loading ? (
          <div className="text-white">Loading feedbacks...</div>
        ) : feedbacks.length > 0 ? (
          feedbacks.map((fb) => (
            <div key={fb.id} className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252]">
              <div className="text-xs text-gray-400 mb-2">
                {new Date(fb.submitted_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: 'numeric', hour12: true
                })}
              </div>
              <div className="text-white text-sm whitespace-pre-wrap">
                {fb.comment || <span className="italic text-gray-500">No comment</span>}
              </div>
            </div>
          ))
        ) : (
          <div className="text-white">No feedbacks submitted yet.</div>
        )}
      </div>
    </div>
  );
}
