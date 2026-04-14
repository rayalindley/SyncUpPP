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

  const [id, setEventId] = useState<string | null>(null);

  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [comment, setComment] = useState("");

  const [certificateId, setCertificateId] = useState<string | null>(null);

  console.log("Component received slug:", slug, "Type:", typeof slug);
  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id")
        .eq("eventslug", slug)
        .single();

      if (error) {
        console.error("Error fetching event:", error);
        return;
      }

      if (data) {
        setEventId(data.id);
      }
    };

    fetchEvent();
  }, [slug]);

  useEffect(() => {
    if (!id) return;

    const fetchFormAndQuestions = async () => {
      const { data: form, error: formError } = await supabase
        .from("forms")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (formError) {
        console.error("Error fetching form:", formError);
        return;
      }

      if (!form) {
        console.warn("No feedback form found for slug:", slug);
        return;
      }

      const fetchedFormId = form.id;
      setFormId(fetchedFormId);

      const { data: allQuestions, error: qError } = await supabase
        .from("questions")
        .select("id, question_text, question_type, metadata");

      if (qError) {
        console.error("Error fetching questions:", qError);
        return;
      }

      setChoiceQuestions(
        allQuestions.filter(
          (q) => (q.question_type || "").toLowerCase() === "choice"
        )
      );
      setLikertQuestions(
        allQuestions.filter(
          (q) => (q.question_type || "").toLowerCase() === "likert"
        )
      );

      const { data: formData, error: fError } = await supabase
        .from("form_questions")
        .select("*, question:question_id(*)")
        .eq("form_id", fetchedFormId);

      if (fError) {
        console.error("Error fetching form questions:", fError);
        return;
      }

      setFormQuestions(
        formData.map((fq) => ({
          ...fq.question,
          question_order: fq.question_order,
        }))
      );

      setAddedQuestions(formData.map((fq) => fq.question_id));
    };

    fetchFormAndQuestions();
  }, [slug, id]);

  const likertLabelsMap: Record<string, string[]> = {
    Agreement: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    Satisfaction: [
      "Very Unsatisfied",
      "Unsatisfied",
      "Neutral",
      "Satisfied",
      "Very Satisfied",
    ],
    Frequency: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    Importance: [
      "Not Important",
      "Slightly Important",
      "Neutral",
      "Very Important",
      "Extremely Important",
    ],
    Effectiveness: [
      "Not Effective",
      "Slightly Effective",
      "Neutral",
      "Very Effective",
      "Extremely Effective",
    ],
  };

  const [isRequired, setIsRequired] = useState(formQuestions.map(() => true));

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const { data: responseData, error: responseError } = await supabase
        .from("form_responses")
        .insert({
          form_id: formId,
          attendee_id: userId,
          event_id: id,
          comment: comment,
        })
        .select("id")
        .single();

      if (responseError) throw responseError;
      const responseId = responseData.id;

      const answersPayload = Object.entries(answers).map(
        ([questionId, answer]) => ({
          response_id: responseId,
          question_id: questionId,
          answer,
        })
      );

      const { error: answersError } = await supabase
        .from("form_answers")
        .insert(answersPayload);

      if (answersError) throw answersError;

      const { data: certSettings } = await supabase
        .from("event_certificate_settings")
        .select("release_option")
        .eq("event_id", id)
        .single();

      if (certSettings?.release_option === "after_feedback_submission") {
        await supabase.from("certificates").insert({
          event_id: id,
          user_id: userId,
          release_status: "released",
          created_at: new Date().toISOString(),
        });

        const { data: cert, error: certError } = await supabase
          .from("certificates")
          .select("certificate_id")
          .eq("event_id", id)
          .eq("user_id", userId)
          .eq("release_status", "released")
          .single();

        if (!certError && cert) {
          setCertificateId(cert.certificate_id);

          await Swal.fire({
            icon: "success",
            title: "Form submitted successfully!",
            html: `
              <p>Thank you for your feedback.</p>
              <div style="margin-top: 15px; padding: 12px; background: rgba(55, 154, 123, 0.1); border: 1px solid rgba(55, 154, 123, 0.2); border-radius: 8px;">
                <p style="font-size: 0.95em; color: #fff; margin-bottom: 0;">
                  You can also view your certificates anytime by going to 
                  <strong style="color: #379A7B;">"My Profile"</strong>.
                </p>
              </div>
              <a href="/api/certificates/${cert.certificate_id}" target="_blank" class="mt-4 inline-block bg-primary text-white px-4 py-2 rounded-md shadow hover:bg-primarydark transition no-underline">
                View Certificate Now
              </a>
            `,
            showConfirmButton: true,
            confirmButtonText: "Done",
            customClass: {
              icon: "text-xs",
              title: "text-lg",
              htmlContainer: "text-base",
              popup: "rounded-lg p-6 shadow-xl border border-gray-700 bg-charleston",
              confirmButton:
                "bg-gray-200 text-gray-800 text-sm px-4 py-2 rounded-md hover:bg-gray-300",
            },
          });

          router.back();
        } else {
          console.error("Failed to fetch certificate ID:", certError);
        }
      } else {
        await Swal.fire({
          icon: "success",
          title: "Form submitted successfully!",
          text: "Thank you for your feedback.",
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            icon: "text-xs",
            title: "text-lg",
            htmlContainer: "text-base",
            popup: "rounded-lg p-6 shadow-xl border border-gray-700",
            confirmButton: "text-sm px-4 py-2 rounded-md",
          },
        });

        router.back();
      }
    } catch (error) {
      console.error("Submission error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to submit your feedback.",
        text: "Please make sure to answer the required questions.",
        timer: 3000,
        showConfirmButton: false,
        customClass: {
          icon: "text-xs",
          title: "text-lg",
          htmlContainer: "text-base",
          popup: "rounded-lg p-6 shadow-xl border border-gray-700",
          confirmButton: "text-sm px-4 py-2 rounded-md",
          cancelButton: "text-sm px-4 py-2 rounded-md",
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
            .sort((a, b) => a.question_order - b.question_order)
            .map((q) => {
              const type = (q.question_type || "").toLowerCase();

              return (
                <div key={q.id} className="space-y-1 text-light mt-4 mb-4 p-2">
                  <label className="text-sm font-medium text-white font-extrabold">
                    {q.question_text}
                  </label>

                  {/* TEXT QUESTIONS */}
                  {(type === "text" ||
                    type === "short_answer" ||
                    type === "input") && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={answers[q.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                        placeholder="Type your answer"
                      />
                    </div>
                  )}

                  {type === "choice" && (
  <div className="mt-2 flex flex-col gap-2">
    {q.metadata?.choices?.length ? (
      q.metadata.choices.map((choice: string, i: number) => (
        <label
          key={i}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors cursor-pointer
            ${answers[q.id] === choice ? "border-green-500/50 bg-green-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
        >
          <input
            type="radio"
            name={`question-${q.id}`}
            onChange={() =>
              setAnswers((prev) => ({ ...prev, [q.id]: choice }))
            }
            className="sr-only"
          />
          <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors
            ${answers[q.id] === choice ? "border-green-500 bg-green-500" : "border-white/30"}`}
          >
            {answers[q.id] === choice && (
              <div className="w-2 h-2 rounded-full bg-green-900" />
            )}
          </div>
          <span className="text-sm font-light text-white">{choice}</span>
        </label>
      ))
    ) : (
      <input
        type="text"
        value={answers[q.id] ?? ""}
        onChange={(e) =>
          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
        }
        className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
        placeholder="Type your answer"
      />
    )}
  </div>
)}

                  {/* LIKERT QUESTIONS */}
                  {type === "likert" &&
                    q.metadata?.category &&
                    likertLabelsMap[q.metadata.category] && (
                      <div>
                        <div className="relative w-full max-w-4xl mx-auto px-4 py-2">
                          <div className="absolute top-[15px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[355px] bg-[#379A7B] z-0" />
                          <div className="absolute top-[17px] left-1/2 transform -translate-x-[47.5%] h-5 w-[349px] bg-[#201c1c] z-0" />
                          <div className="absolute top-[35px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[349px] bg-[#379A7B] z-0" />

                          <div className="flex items-center justify-between relative">
                            {likertLabelsMap[q.metadata.category].map(
                              (label, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col items-center text-center cursor-pointer"
                                  onClick={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: index.toString(),
                                    }))
                                  }
                                >
                                  <div
                                    className={`w-10 h-10 border-2 rounded-full flex items-center justify-center transition-colors ${
                                      answers[q.id] === index.toString()
                                        ? "border-[#379A7B] bg-[#201c1c]"
                                        : "border-[#379A7B] bg-[#201c1c]"
                                    }`}
                                  >
                                    <div
                                      className={`w-6 h-6 rounded-full ${
                                        answers[q.id] === index.toString()
                                          ? "bg-[#379A7B]"
                                          : "bg-transparent border-2 border-[#379A7B]"
                                      }`}
                                    />
                                  </div>
                                  <p className="text-[10px] italic text-white w-24 mt-2">
                                    {label}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              );
            })}

          {/* Comments and Suggestions TextArea */}
          <div className="space-y-1 text-light mt-6 mb-6">
            <label
              htmlFor="comment"
              className="text-sm font-medium font-bold text-white"
            >
              Comments and Suggestions
            </label>
            <textarea
              required
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-end rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>

        {/* --- Post-Submission Certificate UI --- */}
        {certificateId && (
          <div className="mt-8 p-6 border border-white/10 bg-white/5 rounded-lg text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-gray-300 text-sm mb-4">
              🎉 Your certificate is ready! You can view it here or find it later by going to your 
              <span className="text-primary font-bold"> "My Profile"</span> page.
            </p>
            <a
              href={`/api/certificates/${certificateId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-primary hover:bg-primarydark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
            >
              🎓 View Your Certificate
            </a>
          </div>
        )}
      </div>
    </>
  );
}