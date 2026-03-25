/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useEffect, useState } from "react";
import "@yaireo/tagify/dist/tagify.css";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import { Question } from "@/types/questions";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const supabase = createClient();

export default function FeedbackFormAttendees({
  slug,
  userId,
}: {
  slug: any;
  userId: any;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formId, setFormId] = useState<number | null>(null);
  const [choiceQuestions, setChoiceQuestions] = useState<Question[]>([]);
  const [likertQuestions, setLikertQuestions] = useState<Question[]>([]);
  const [addedQuestions, setAddedQuestions] = useState<number[]>([]);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);

  const [eventId, setEventId] = useState<string | null>(null);

  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [comment, setComment] = useState("");

  const [certificateId, setCertificateId] = useState<string | null>(null);

  // mapping used for Likert rendering in the original component
  const likertLabelsMap: Record<string, string[]> = {
    Agreement: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    Satisfaction: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"],
    Frequency: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    Importance: ["Not Important", "Slightly Important", "Neutral", "Very Important", "Extremely Important"],
    Effectiveness: ["Not Effective", "Slightly Effective", "Neutral", "Very Effective", "Extremely Effective"],
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await supabase
          .from("events")
          .select("eventid")
          .eq("eventslug", slug)
          .single();

        if (data) {
          setEventId(data.eventid);
        }
      } catch (err) {
        console.error("Failed to fetch event id for slug", slug, err);
      }
    };

    fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (!eventId) return;

    const fetchFormAndQuestions = async () => {
      let fetchedFormId: number | null = null;

      try {
        // Try to get existing form for this slug/event
        const { data: form, error: formError } = await supabase
          .from("forms")
          .select("id")
          .eq("slug", slug)
          .single();

        if (form && !formError) {
          fetchedFormId = form.id;
        } else {
          // create a form row referencing the event
          const { data: newForm, error: insertError } = await supabase
            .from("forms")
            .insert([{ event_id: eventId, slug: slug }])
            .select()
            .single();

          if (insertError) {
            console.error("Error creating new form:", insertError);
            return;
          }
          fetchedFormId = newForm?.id ?? null;
        }

        setFormId(fetchedFormId);

        // Fetch questions catalog
        const { data: allQuestions, error: qError } = await supabase
          .from("questions")
          .select("id, question_text, question_type, likert_category, question_order, choices");

        if (qError) {
          console.error("Error fetching questions:", qError);
          return;
        }

        const questionsArray = allQuestions || [];
        setChoiceQuestions(questionsArray.filter((q: any) => q.question_type === "Choice"));
        setLikertQuestions(questionsArray.filter((q: any) => q.question_type === "Likert"));

        // If there is a form_questions table that links questions to form, fetch those (optional)
        const { data: fq } = await supabase
          .from("form_questions")
          .select("question_id")
          .eq("form_id", fetchedFormId)
          .order("question_order", { ascending: true });

        if (fq) {
          // map to full question objects
          const qIds = fq.map((r: any) => r.question_id);
          const ordered = qIds
            .map((id: any) => questionsArray.find((qq: any) => qq.id === id))
            .filter(Boolean);
          setFormQuestions(ordered);
        } else {
          // fallback: use all questions (or a subset)
          setFormQuestions(questionsArray.sort((a: any, b: any) => (a.question_order ?? 0) - (b.question_order ?? 0)));
        }
      } catch (err) {
        console.error("Error preparing form and questions:", err);
      }
    };

    fetchFormAndQuestions();
  }, [eventId, slug]);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // 1) Insert form_responses
      const { data: responseData, error: responseError } = await supabase
        .from("form_responses")
        .insert({
          form_id: formId,
          attendee_id: userId,
          comment: comment,
          submitted_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (responseError) throw responseError;

      const responseId = responseData.id;

      // 2) Insert answers
      const answersPayload = Object.entries(answers).map(([questionId, answer]) => ({
        response_id: responseId,
        question_id: questionId,
        answer,
      }));

      if (answersPayload.length > 0) {
        const { error: answersError } = await supabase.from("form_answers").insert(answersPayload);
        if (answersError) throw answersError;
      }

      // 3) Optionally issue certificate if event setting requires after feedback submission
      try {
        const { data: certSettings } = await supabase
          .from("event_certificate_settings")
          .select("release_option")
          .eq("event_id", eventId)
          .single();

        if (certSettings?.release_option === "after_feedback_submission") {
          const { data: certInsert } = await supabase.from("certificates").insert({
            event_id: eventId,
            user_id: userId,
            release_status: "released",
            created_at: new Date().toISOString(),
          }).select().single();

          setCertificateId(certInsert?.id ?? null);
        }
      } catch (certErr) {
        console.warn("Certificate issuance check failed:", certErr);
      }

      // 4) NEW: insert a canonical feedback row into public.feedbacks so processor picks it up
      try {
        // attempt to extract a numeric Likert from the answers if any exist
        let inferredLikert: number | null = null;
        // Check answersPayload for a numeric 1..5
        for (const a of answersPayload) {
          const v = a.answer;
          const n = typeof v === "number" ? v : Number(v);
          if (!Number.isNaN(n) && n >= 1 && n <= 5) {
            inferredLikert = Math.round(n);
            break;
          }
        }

        // If no numeric likert found above, query the form_answers for numeric ones (defensive)
        if (inferredLikert === null) {
          const { data: likertAnswers } = await supabase
            .from("form_answers")
            .select("answer")
            .eq("response_id", responseId)
            .in("answer", ["1", "2", "3", "4", "5"])
            .limit(1);

          if (likertAnswers && likertAnswers.length > 0) {
            inferredLikert = Number(likertAnswers[0].answer);
          }
        }

        const feedbackRow: any = {
          // match the column used in your feedbacks table. If your feedbacks table uses eventid instead of event_id, change accordingly.
          event_id: eventId ?? null,
          userid: userId ?? null,
          text: comment || "",
          likert: inferredLikert,
          metadata: { form_response_id: responseId, answers: answersPayload },
          processed: false,
          created_at: new Date().toISOString(),
        };

        const { error: insertFeedbackError } = await supabase.from("feedbacks").insert(feedbackRow);
        if (insertFeedbackError) {
          // not fatal for the user experience; log for debugging so the processor can be adjusted later
          console.warn("Failed to insert into feedbacks table:", insertFeedbackError);
        }
      } catch (fbErr) {
        console.error("Error inserting canonical feedbacks row:", fbErr);
      }

      // 5) Success UX
      Swal.fire({
        icon: "success",
        title: "Feedback submitted",
        text: "Thank you for your feedback!",
        showConfirmButton: false,
        timer: 1800,
        customClass: {
          popup: "rounded-lg p-6 shadow-xl border border-gray-700",
        },
      });

      // reset UI
      setAnswers({});
      setComment("");
    } catch (error: any) {
      console.error("Submission error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to submit your feedback.",
        text: "Please make sure to answer the required questions.",
        timer: 3000,
        showConfirmButton: false,
        customClass: {
          popup: "rounded-lg p-6 shadow-xl border border-gray-700",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {formQuestions
            .sort((a: any, b: any) => (a.question_order ?? 0) - (b.question_order ?? 0))
            .map((q: any) => (
              <div key={q.id} className="space-y-1 text-light mt-4 mb-4 p-2">
                <label className="text-sm font-medium text-white font-extrabold">
                  {q.question_text}
                </label>

                {q.question_type === "Choice" && q.choices?.map((choice: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 my-1">
                    <input
                      type="radio"
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: choice }))}
                      name={`question-${q.id}`}
                      className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark"
                    />
                    <label className="text-sm font-medium font-light text-white">
                      {choice}
                    </label>
                  </div>
                ))}

                {q.question_type === "Likert" && likertLabelsMap[q.likert_category] && (
                  <div>
                    <div className="relative w-full max-w-4xl mx-auto px-4 py-2">
                      <div className="absolute top-[15px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[355px] bg-[#379A7B] z-0" />
                      <div className="absolute top-[17px] left-1/2 transform -translate-x-[47.5%] h-5 w-[349px] bg-[#201c1c] z-0" />
                      <div className="flex items-center justify-between relative">
                        {likertLabelsMap[q.likert_category].map((label, index) => (
                          <div key={index} className="flex flex-col items-center text-center">
                            <div
                              onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: (index + 1).toString() }))}
                              className={`w-10 h-10 border-2 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                                answers[q.id] === (index + 1).toString() ? "border-[#379A7B] bg-[#201c1c]" : "border-[#379A7B] bg-[#201c1c]"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full ${
                                  answers[q.id] === (index + 1).toString() ? "bg-[#379A7B]" : "bg-transparent border-2 border-[#379A7B]"
                                }`}
                              />
                            </div>
                            <p className="text-[10px] italic text-white w-24 mt-2">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* Comments and Suggestions TextArea */}
          <div className="space-y-1 text-light mt-6 mb-6">
            <label htmlFor="description" className="text-sm font-medium font-bold text-white">
              Comments and Suggestions
            </label>
            <textarea
              required
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-end rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-charleston"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

        {certificateId && (
          <div className="mt-4 text-center">
            <a
              href={`/api/certificates/${certificateId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-light bg-primary hover:bg-primarydark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              🎓 View Your Certificate
            </a>
          </div>
        )}
      </div>
    </>
  );
}