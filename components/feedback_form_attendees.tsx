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
  // const { eventslug } = useParams() as { eventslug: string };

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formId, setFormId] = useState<number | null>(null);
  const [choiceQuestions, setChoiceQuestions] = useState<Question[]>([]);
  const [likertQuestions, setLikertQuestions] = useState<Question[]>([]);
  const [addedQuestions, setAddedQuestions] = useState<number[]>([]);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);

  const [eventId, setEventId] = useState<string | null>(null);

  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [comment, setComment] = useState("");

  const [certificateId, setCertificateId] = useState<string | null>(null);


  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("eventid")
        .eq("eventslug", slug)
        .single();

      if (data) {
        setEventId(data.eventid);
      }
    };

    fetchEvent();
  }, [slug]);

  useEffect(() => {
    if(!eventId) return;

    const fetchFormAndQuestions = async () => {
      let fetchedFormId: number | null = null;

      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('slug', slug)
        .single();

      if (form && !formError) {
        fetchedFormId = form.id;
      } else {
        const { data: newForm, error: insertError } = await supabase
          .from('forms')
          .insert([{ event_id: eventId, slug: slug}])
          .select()
          .single();

        console.log("eventid:", eventId);

        if (insertError || !newForm) {
          console.error('Error creating new form:', insertError);
          return;
        }

        fetchedFormId = newForm.id;
      }

      setFormId(fetchedFormId);

      const { data: allQuestions, error: qError } = await supabase
        .from('questions')
        .select('id, question_text, question_type, likert_category');

      if (qError) {
        console.error('Error fetching questions:', qError);
        return;
      } else {
        console.log("successful fetching questions", allQuestions);
      }

      setChoiceQuestions(allQuestions.filter(q => q.question_type === 'Choice'));
      setLikertQuestions(allQuestions.filter(q => q.question_type === 'Likert'));

      // console.log("choiceQuestions", choiceQuestions);

      const { data: formData, error: fError } = await supabase
        .from('form_questions')
        .select('*, question:question_id(*)')
        .eq('form_id', fetchedFormId);

      if (fError) {
        console.error('Error fetching form questions:', fError);
        return;
      }

      setFormQuestions(formData.map(fq => ({
        ...fq.question,
        question_order: fq.question_order
      })));

      setAddedQuestions(formData.map(fq => fq.question_id));
    };

    fetchFormAndQuestions();
  }, [slug, eventId]);


  const likertLabelsMap: Record<string, string[]> = {
    Agreement: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
    Satisfaction: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"],
    Frequency: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    Importance: ["Not Important", "Slightly Important", "Neutral", "Very Important", "Extremely Important"],
    Effectiveness: ["Not Effective", "Slightly Effective", "Neutral", "Very Effective", "Extremely Effective"],
  };

  const [selected, setSelected] = useState<number>(0);

  const [isRequired, setIsRequired] = useState(
    formQuestions.map(() => true)
  );

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const { data: responseData, error: responseError } = await supabase
        .from("form_responses")
        .insert({
          form_id: formId,
          attendee_id: userId,
          comment: comment,
          // certificate_preference: certPreference,
        })
        .select("id")
        .single();

      if (responseError) throw responseError;
      const responseId = responseData.id;

      const answersPayload = Object.entries(answers).map(([questionId, answer]) => ({
        response_id: responseId,
        question_id: questionId,
        answer,
      }));

      const { error: answersError } = await supabase
        .from("form_answers")
        .insert(answersPayload);

      if (answersError) throw answersError;

      // await Swal.fire({
      //   icon: "success",
      //   title: "Form submitted successfully!",
      //   text: "Thank you for sending a feedback.",
      //   timer: 3000,
      //   showConfirmButton: false,

      //   customClass: {
      //     icon: "text-xs",
      //     title: "text-lg",
      //     htmlContainer: "text-base",
      //     popup: "rounded-lg p-6 shadow-xl border border-gray-700",
      //     confirmButton: "text-sm px-4 py-2 rounded-md",
      //     cancelButton: "text-sm px-4 py-2 rounded-md",
      //   }
      // });

      // router.back();

      const { data: certSettings } = await supabase
        .from("event_certificate_settings")
        .select("release_option")
        .eq("event_id", eventId)
        .single();

      if(certSettings?.release_option === "after_feedback_submission") {
        // Insert certificate
        await supabase.from("certificates").insert({
          event_id: eventId,
          user_id: userId,
          release_status: "released",
          created_at: new Date().toISOString(),
        });

        // Get cert ID to show download link
        const { data: cert, error: certError } = await supabase
          .from("certificates")
          .select("certificate_id")
          .eq("event_id", eventId)
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
              <a href="/api/certificates/${cert.certificate_id}" target="_blank" class="mt-4 inline-block bg-primary text-white px-4 py-2 rounded-md shadow hover:bg-primarydark transition">
                View Certificate
              </a>
            `,
            showConfirmButton: true,
            confirmButtonText: "Done",
            customClass: {
              icon: "text-xs",
              title: "text-lg",
              htmlContainer: "text-base",
              popup: "rounded-lg p-6 shadow-xl border border-gray-700",
              confirmButton: "bg-gray-200 text-gray-800 text-sm px-4 py-2 rounded-md hover:bg-gray-300",
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
        }
      });
    } finally {
      setIsLoading(false);
    }

    

    
  };

  


  
  return (
    <>
    <div>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}>
        {formQuestions
          .sort((a, b) => a.question_order - b.question_order)
          .map((q) => (
            <div
              key={q.id}
              // onClick={() => handleClicked(i)}
              className={`space-y-1 text-light mt-4 mb-4 p-2 `}>

              {/* Question Text */}
              <label className={`text-sm font-medium text-white font-extrabold`}>
                {q.question_text}
              </label>

              {q.question_type === 'Choice' && q.choices?.map((choice: string, i: number) => (
                <div key={i}>
                  <input type="radio" onChange={() => setAnswers(prev => ({ ...prev, [q.id]: choice }))} name={`question-${q.id}`} className={`ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark`}/>
                  <label className={`text-sm font-medium font-light text-white`}>
                    {choice}
                  </label>
                  <br />
                </div>
              ))}

              {q.question_type === 'Likert' && likertLabelsMap[q.likert_category] && (
                <div>
                  <div className="relative w-full max-w-4xl mx-auto px-4 py-2">
                    <div className="absolute top-[15px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[355px] bg-[#379A7B] z-0" />
                    <div className="absolute top-[17px] left-1/2 transform -translate-x-[47.5%] h-5 w-[349px] bg-[#201c1c] z-0" />
                    <div className="absolute top-[35px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[349px] bg-[#379A7B] z-0" />

                    <div className="flex items-center justify-between relative">
                      {likertLabelsMap[q.likert_category].map((label, index) => (
                        <div key={index} className="flex flex-col items-center text-center" onClick={() => setAnswers(prev => ({ ...prev, [q.id]: index.toString() }))}>
                          <div
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: index }))}
                            className={`w-10 h-10 border-2 rounded-full flex items-center justify-center cursor-pointer transition-colors
                              ${answers[q.id] === index.toString() ? "border-[#379A7B] bg-[#201c1c]" : "border-[#379A7B] bg-[#201c1c]"}
                            `}
                          >
                            <div
                              className={`w-6 h-6 rounded-full
                                ${answers[q.id] === index.toString() ? "bg-[#379A7B]" : "bg-transparent border-2 border-[#379A7B]"}
                              `}
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
          <textarea required id="comment" value={comment} onChange={(e)=>setComment(e.target.value)} className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"></textarea>
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