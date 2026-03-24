/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useEffect, useState } from "react";
import "@yaireo/tagify/dist/tagify.css";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import { Question } from "@/types/questions";
import { useRouter } from "next/navigation";
import { CiShare2 } from "react-icons/ci";
import Swal from "sweetalert2";
import { deleteForm } from "@/lib/feedback";

const supabase = createClient();

// ─── Reusable icons ──────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <g id="SVGRepo_iconCarrier">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z"
        fill="#ffffff" />
    </g>
  </svg>
);

const TriangleIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`flex-shrink-0 transition-transform ${open ? "scale-y-100" : "-scale-y-100"}`}
    width="15px" height="15px" viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg" fill="none"
  >
    <g id="SVGRepo_iconCarrier">
      <path fill="#ffffff"
        d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z" />
    </g>
  </svg>
);

// ─── QuestionPickerRow ────────────────────────────────────────────────────────
const QuestionPickerRow = ({
  q,
  indent = false,
  addedQuestions,
  onAdd,
}: {
  q: Question;
  indent?: boolean;
  addedQuestions: string[];
  onAdd: (id: string) => void;
}) => {
  const alreadyAdded = addedQuestions.includes(String(q.id).trim());
  if (alreadyAdded) return null;

  return (
    <div className={`flex items-center border border-[#444444] ${indent ? "pl-2 bg-[#1D1C1C]" : ""}`}>
      <button
        type="button"
        onClick={() => onAdd(String(q.id))}
        className="flex items-center gap-1 flex-1 py-1 hover:bg-white/10 transition-colors text-left"
      >
        <PlusIcon />
        <span className="text-sm">{q.question_text}</span>
      </button>
    </div>
  );
};

// ─── LikertSection ────────────────────────────────────────────────────────────
const LikertSection = ({
  label,
  category,
  show,
  toggle,
  likertQuestions,
  addedQuestions,
  onAdd,
}: {
  label: string;
  category: string;
  show: boolean;
  toggle: () => void;
  likertQuestions: Question[];
  addedQuestions: string[];
  onAdd: (id: string) => void;
}) => {
  const available = likertQuestions.filter(
    (q) =>
      q.metadata?.category === category &&
      !addedQuestions.includes(String(q.id).trim())
  );

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="flex justify-between w-full items-center p-2 hover:bg-white/5"
      >
        <p>{label}</p>
        <TriangleIcon open={show} />
      </button>

      {show && (
        <>
          {available.length === 0 ? (
            <div className="pl-4 py-2 text-xs text-gray-400 italic bg-[#1D1C1C] border border-[#444444]">
              All questions in this category have been added.
            </div>
          ) : (
            available.map((q) => (
              <QuestionPickerRow
                key={q.id}
                q={q}
                indent
                addedQuestions={addedQuestions}
                onAdd={onAdd}
              />
            ))
          )}
          <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444] opacity-60 cursor-not-allowed">
            <PlusIcon />
            <div className="italic text-sm">Custom Question</div>
            <div className="italic text-xs ml-auto pr-3">PAID</div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function FeedbackFormOrganizer({
  selectedEvent,
  userId,
}: {
  selectedEvent: any;
  userId: any;
}) {
  const [isAddQModalOpen, setIsAddQModalOpen] = useState(false);
  const [questionType, setQuestionType] = useState("text");
  const [showAgreement, setShowAgreement] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [showFrequency, setShowFrequency] = useState(false);
  const [showImportance, setShowImportance] = useState(false);
  const [showEffectiveness, setShowEffectiveness] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formId, setFormId] = useState<string | null>(null); 
  const [textQuestions, setTextQuestions] = useState<Question[]>([]);
  const [choiceQuestions, setChoiceQuestions] = useState<Question[]>([]);
  const [likertQuestions, setLikertQuestions] = useState<Question[]>([]);
  const [addedQuestions, setAddedQuestions] = useState<string[]>([]);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isClicked, setIsClicked] = useState<boolean[]>([]);
  const [isRequired, setIsRequired] = useState<boolean[]>([]);

  // 1. FETCH ALL GLOBAL QUESTIONS FIRST
  useEffect(() => {
    const fetchGlobalQuestions = async () => {
      const { data: allQuestions, error: qError } = await supabase
        .from("questions")
        .select("id, question_text, question_type, metadata");

      if (qError || !allQuestions) {
        console.error("Error fetching global questions:", qError);
        return;
      }

      setTextQuestions(allQuestions.filter((q: any) => q.question_type === "Text" || q.question_type === "text"));
      setChoiceQuestions(allQuestions.filter((q: any) => q.question_type === "Choice" || q.question_type === "choice"));
      setLikertQuestions(allQuestions.filter((q: any) => q.question_type === "Likert" || q.question_type === "likert"));
    };

    fetchGlobalQuestions();
  }, []);

  // 2. FETCH EVENT AND FORM
  useEffect(() => {
    if (!selectedEvent) return;

    const fetchEventAndForm = async () => {
      // Fetch Event ID
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("eventid")
        .eq("eventslug", selectedEvent)
        .single();

      if (eventError || !eventData) {
        console.error("Event fetch error:", eventError);
        return;
      }

      const currentEventId = eventData.eventid;
      setEventId(currentEventId);

      // Fetch or Create Form
      let currentFormId: string | null = null;
      const { data: form, error: formError } = await supabase
        .from("forms")
        .select("id")
        .eq("slug", selectedEvent)
        .maybeSingle();

      if (form) {
        currentFormId = form.id;
      } else {
        const { data: newForm, error: insertError } = await supabase
          .from("forms")
          .insert([{ event_id: currentEventId, slug: selectedEvent }])
          .select()
          .single();

        if (insertError || !newForm) {
          console.error("Error creating new form:", insertError);
          return;
        }
        currentFormId = newForm.id;
      }

      setFormId(currentFormId);

      // Fetch existing added questions
      const { data: formData, error: fError } = await supabase
        .from("form_questions")
        .select("*, question:question_id(*)")
        .eq("form_id", currentFormId);

      if (fError) {
        console.error("Error fetching form questions:", fError);
        return;
      }

      if (formData) {
        setFormQuestions(
          formData.map((fq: any) => ({
            ...fq.question,
            question_order: fq.question_order,
          }))
        );
        setAddedQuestions(formData.map((fq: any) => String(fq.question_id).trim()));
        setIsRequired(formData.map((fq: any) => fq.is_required ?? true));
      }
    };

    fetchEventAndForm();
  }, [selectedEvent]);

  // 3. HANDLE ADDING A QUESTION (FULLY FIXED)
  const handleAddQuestion = async (questionId: string) => {
    if (!formId) return;
    const cleanId = String(questionId).trim();

    // Prevent adding duplicates to state immediately
    if (addedQuestions.includes(cleanId)) return;

    // Optimistically update UI so it feels instant
    setAddedQuestions((prev) => [...prev, cleanId]);

    // Fetch current max order
    const { data: existingQuestions } = await supabase
      .from("form_questions")
      .select("question_order")
      .eq("form_id", formId)
      .order("question_order", { ascending: false })
      .limit(1);

    // Safely calculate next integer order
    const newOrder = existingQuestions && existingQuestions.length > 0 
      ? existingQuestions[0].question_order + 1 
      : 0;

    // Insert into DB (Includes is_required: true)
    const { error: insertError } = await supabase.from("form_questions").insert({
      form_id: formId,
      question_id: cleanId,
      question_order: newOrder,
      is_required: true
    });

    if (insertError) {
      console.error("Error adding question:", insertError);
      // Revert optimistic update on failure
      setAddedQuestions((prev) => prev.filter(id => id !== cleanId));
      return;
    }

    // Fetch full question data to render in the bottom preview
    const { data: questionData, error: fetchError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", cleanId)
      .single();

    if (fetchError || !questionData) {
      console.error("Error fetching question data:", fetchError);
      return;
    }

    // Append the full question object to the form list
    setFormQuestions((prev) => [
      ...prev,
      { ...questionData, question_order: newOrder },
    ]);
    
    setIsRequired((prev) => [...prev, true]);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!formId) return;
    const cleanId = String(questionId).trim();

    const { error: deleteError } = await supabase
      .from("form_questions")
      .delete()
      .eq("question_id", cleanId)
      .eq("form_id", formId);

    if (deleteError) {
      console.error("Error deleting question:", deleteError);
      return;
    }

    const { data: remaining, error: fetchError } = await supabase
      .from("form_questions")
      .select("id")
      .eq("form_id", formId)
      .order("question_order", { ascending: true });

    if (!fetchError && remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from("form_questions")
          .update({ question_order: i })
          .eq("id", remaining[i].id);
      }
    }

    setFormQuestions((prev) =>
      prev.filter((q) => String(q.id).trim() !== cleanId)
    );
    setAddedQuestions((prev) => prev.filter((id) => id !== cleanId));
  };

  const handleMoveUpQuestion = async (index: number) => {
    if (index === 0) return;
    const curr = formQuestions[index];
    const above = formQuestions[index - 1];

    const [res1, res2] = await Promise.all([
      supabase
        .from("form_questions")
        .update({ question_order: above.question_order })
        .eq("question_id", curr.id)
        .eq("form_id", formId),
      supabase
        .from("form_questions")
        .update({ question_order: curr.question_order })
        .eq("question_id", above.id)
        .eq("form_id", formId),
    ]);
    if (res1.error || res2.error) return;

    const updated = [...formQuestions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const t = updated[index].question_order;
    updated[index].question_order = updated[index - 1].question_order;
    updated[index - 1].question_order = t;
    setFormQuestions(updated.sort((a, b) => a.question_order - b.question_order));
  };

  const handleMoveDownQuestion = async (index: number) => {
    if (index === formQuestions.length - 1) return;
    const curr = formQuestions[index];
    const below = formQuestions[index + 1];

    const [res1, res2] = await Promise.all([
      supabase
        .from("form_questions")
        .update({ question_order: below.question_order })
        .eq("question_id", curr.id)
        .eq("form_id", formId),
      supabase
        .from("form_questions")
        .update({ question_order: curr.question_order })
        .eq("question_id", below.id)
        .eq("form_id", formId),
    ]);
    if (res1.error || res2.error) return;

    const updated = [...formQuestions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const t = updated[index].question_order;
    updated[index].question_order = updated[index + 1].question_order;
    updated[index + 1].question_order = t;
    setFormQuestions(updated.sort((a, b) => a.question_order - b.question_order));
  };

  const handleClicked = (index: number) => {
    setIsClicked((prev) => {
      const s = [...prev];
      s[index] = !s[index];
      return s;
    });
  };

  const deleteFeedbackForm = async () => {
    const result = await Swal.fire({
      title: "Are you sure you want to delete this feedback form?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
      customClass: {
        title: "text-lg",
        htmlContainer: "text-base",
        popup: "rounded-lg p-6 shadow-xl border border-gray-700",
        confirmButton: "text-sm px-4 py-2 rounded-md",
        cancelButton: "text-sm px-4 py-2 rounded-md",
      },
    });

    if (result.isConfirmed) {
      const response = await deleteForm(formId as any, selectedEvent);
      if (!response.error) {
        Swal.fire({
          title: "Deleted!",
          text: "Feedback form successfully deleted.",
          icon: "success",
        }).then(() => window.history.back());
      } else {
        Swal.fire({
          title: "Failed!",
          text: response.error.message,
          icon: "error",
        });
      }
    }
  };

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

  return (
    <>
      <div>
        <div className="flex justify-end mb-4 items-center">
          <div
            className="flex items-center group relative cursor-pointer"
            onClick={() =>
              navigator.clipboard
                .writeText(
                  `${window.location.origin}/feedback/${selectedEvent}`
                )
                .then(() => {
                  Swal.fire({
                    icon: "success",
                    title: "Link copied!",
                    text: "Feedback form link has been copied to your clipboard.",
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
                })
            }
          >
            <button type="button">
              <CiShare2 color="white" className="text-2xl" />
            </button>
            <span className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 whitespace-nowrap">
              Copy link
            </span>
          </div>

          <button
            type="button"
            className="flex items-center rounded-md bg-primary px-3 py-1.5 ml-2 hover:bg-primarydark"
            onClick={() => router.push(`/feedback/${selectedEvent}`)}
          >
            <div className="text-white ml-1 text-md">Preview</div>
          </button>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsAddQModalOpen(true)}
            className="sm:w-full sm:max-w-full bg-[#379A7B] rounded-md text-white font-bold px-4 py-2 flex items-center gap-2 hover:bg-primarydark"
          >
            <svg
              width="30px"
              height="30px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_iconCarrier">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12.75 9C12.75 8.58579 12.4142 8.25 12 8.25C11.5858 8.25 11.25 8.58579 11.25 9L11.25 11.25H9C8.58579 11.25 8.25 11.5858 8.25 12C8.25 12.4142 8.58579 12.75 9 12.75H11.25V15C11.25 15.4142 11.5858 15.75 12 15.75C12.4142 15.75 12.75 15.4142 12.75 15L12.75 12.75H15C15.4142 12.75 15.75 12.4142 15.75 12C15.75 11.5858 15.4142 11.25 15 11.25H12.75V9Z"
                  fill="#ffffff"
                />
              </g>
            </svg>
            <p className="text-base/7">Add question</p>
          </button>

          {isAddQModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-[#1C1C1C] p-6 rounded-md shadow-md w-full max-w-md text-white relative">

                <div className="flex items-center justify-center mb-4 relative">
                  <h2 className="text-m font-semibold text-white">
                    Add question
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsAddQModalOpen(false)}
                    className="absolute right-0"
                  >
                    <svg
                      width="30px"
                      height="30px"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.9393 12L6.9696 15.9697L8.03026 17.0304L12 13.0607L15.9697 17.0304L17.0304 15.9697L13.0607 12L17.0303 8.03039L15.9696 6.96973L12 10.9393L8.03038 6.96973L6.96972 8.03039L10.9393 12Z"
                        fill="#ffffff"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex justify-between items-center pl-6 pr-6 mb-6">
                  {(["text", "choice", "likert"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setQuestionType(tab)}
                      className={`capitalize ${
                        questionType === tab
                          ? "border-b-4 border-white font-bold"
                          : "border-b-4 border-transparent"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {questionType === "text" && (
                  <div className="bg-[#282828]">
                    {textQuestions.filter(
                      (q) => !addedQuestions.includes(String(q.id).trim())
                    ).length === 0 ? (
                      <div className="p-3 text-sm text-gray-400 italic">
                        All text questions have been added.
                      </div>
                    ) : (
                      textQuestions
                        .filter(
                          (q) => !addedQuestions.includes(String(q.id).trim())
                        )
                        .map((q) => (
                          <QuestionPickerRow
                            key={q.id}
                            q={q}
                            addedQuestions={addedQuestions}
                            onAdd={handleAddQuestion}
                          />
                        ))
                    )}
                  </div>
                )}

                {questionType === "choice" && (
                  <div className="bg-[#282828]">
                    {choiceQuestions.filter(
                      (q) => !addedQuestions.includes(String(q.id).trim())
                    ).length === 0 ? (
                      <div className="p-3 text-sm text-gray-400 italic">
                        All choice questions have been added.
                      </div>
                    ) : (
                      choiceQuestions
                        .filter(
                          (q) => !addedQuestions.includes(String(q.id).trim())
                        )
                        .map((q) => (
                          <QuestionPickerRow
                            key={q.id}
                            q={q}
                            addedQuestions={addedQuestions}
                            onAdd={handleAddQuestion}
                          />
                        ))
                    )}
                    <div className="flex items-center border border-[#444444] opacity-60 cursor-not-allowed">
                      <PlusIcon />
                      <div className="italic text-sm">Custom Question</div>
                      <div className="italic text-xs ml-auto pr-3">PAID</div>
                    </div>
                  </div>
                )}

                {questionType === "likert" && (
                  <div className="max-h-[500px] overflow-y-auto bg-[#282828] border border-[#444444]">
                    <LikertSection
                      label="Agreement-Based Questions"
                      category="Agreement"
                      show={showAgreement}
                      toggle={() => setShowAgreement((p) => !p)}
                      likertQuestions={likertQuestions}
                      addedQuestions={addedQuestions}
                      onAdd={handleAddQuestion}
                    />
                    <LikertSection
                      label="Satisfaction-Based Questions"
                      category="Satisfaction"
                      show={showSatisfaction}
                      toggle={() => setShowSatisfaction((p) => !p)}
                      likertQuestions={likertQuestions}
                      addedQuestions={addedQuestions}
                      onAdd={handleAddQuestion}
                    />
                    <LikertSection
                      label="Frequency-Based Questions"
                      category="Frequency"
                      show={showFrequency}
                      toggle={() => setShowFrequency((p) => !p)}
                      likertQuestions={likertQuestions}
                      addedQuestions={addedQuestions}
                      onAdd={handleAddQuestion}
                    />
                    <LikertSection
                      label="Importance-Based Questions"
                      category="Importance"
                      show={showImportance}
                      toggle={() => setShowImportance((p) => !p)}
                      likertQuestions={likertQuestions}
                      addedQuestions={addedQuestions}
                      onAdd={handleAddQuestion}
                    />
                    <LikertSection
                      label="Effectiveness-Based Questions"
                      category="Effectiveness"
                      show={showEffectiveness}
                      toggle={() => setShowEffectiveness((p) => !p)}
                      likertQuestions={likertQuestions}
                      addedQuestions={addedQuestions}
                      onAdd={handleAddQuestion}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {formQuestions
          .sort((a, b) => a.question_order - b.question_order)
          .map((q, i) => (
            <div
              key={q.id}
              onClick={() => handleClicked(i)}
              className={`space-y-1 text-light mt-4 mb-4 p-2 hover:bg-white/5 transition-all duration-300 ease-in-out ${
                isClicked[i]
                  ? "bg-white/5 border-t-2 border-primary cursor-default"
                  : "border-t-0 border-transparent cursor-pointer"
              }`}
            >
              {isClicked[i] && (
                <div className="flex justify-between">
                  <div className="flex justify-start">
                    <label className="inline-flex items-center me-5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isRequired[i] ?? true}
                        onChange={() => {
                          const t = [...isRequired];
                          t[i] = !(t[i] ?? true);
                          setIsRequired(t);
                        }}
                      />
                      <div className="ml-2 relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600" />
                      <span className="ms-3 text-xs font-medium text-white mr-2">
                        Required
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(String(q.id));
                      }}
                    >
                      <svg
                        className="hover:fill-red ml-2 mr-2"
                        width="20px"
                        height="20px"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g id="SVGRepo_iconCarrier">
                          <path
                            d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17"
                            stroke="#ffffff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDownQuestion(i);
                      }}
                    >
                      <svg
                        className="ml-2 mr-2"
                        width="20px"
                        height="20px"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        transform="matrix(-1, 0, 0, -1, 0, 0)"
                      >
                        <g id="SVGRepo_iconCarrier">
                          <path
                            className={
                              i === formQuestions.length - 1
                                ? "fill-white/50"
                                : "fill-white"
                            }
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289L19.7071 10.2929C20.0976 10.6834 20.0976 11.3166 19.7071 11.7071C19.3166 12.0976 18.6834 12.0976 18.2929 11.7071L13 6.41421V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V6.41421L5.70711 11.7071C5.31658 12.0976 4.68342 12.0976 4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929L11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3Z"
                          />
                        </g>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUpQuestion(i);
                      }}
                    >
                      <svg
                        className="ml-2 mr-2"
                        width="20px"
                        height="20px"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g id="SVGRepo_iconCarrier">
                          <path
                            className={i === 0 ? "fill-white/50" : "fill-white"}
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289L19.7071 10.2929C20.0976 10.6834 20.0976 11.3166 19.7071 11.7071C19.3166 12.0976 18.6834 12.0976 18.2929 11.7071L13 6.41421V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V6.41421L5.70711 11.7071C5.31658 12.0976 4.68342 12.0976 4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929L11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3Z"
                          />
                        </g>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <label
                className={`text-sm font-medium text-white font-bold ${
                  isClicked[i] ? "cursor-default" : "cursor-pointer"
                }`}
              >
                {q.question_text}
              </label>

              {q.question_type === "Text" && (
                <input
                  disabled
                  type="text"
                  placeholder="Text answer..."
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 px-2 text-white shadow-sm ring-1 ring-inset ring-white/10 sm:text-sm cursor-default"
                />
              )}

              {q.question_type === "Choice" &&
                q.metadata?.choices?.map((choice: string, idx: number) => (
                  <div key={idx} className="cursor-default">
                    <input
                      disabled
                      type="radio"
                      id={`q${q.id}c${idx}`}
                      className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-default"
                    />
                    <label
                      htmlFor={`q${q.id}c${idx}`}
                      className="text-sm font-light text-white cursor-default"
                    >
                      {choice}
                    </label>
                    <br />
                  </div>
                ))}

              {q.question_type === "Likert" &&
                q.metadata?.category &&
                likertLabelsMap[q.metadata.category] && (
                  <div className="cursor-default">
                    <div className="relative w-full max-w-4xl mx-auto px-4 py-2">
                      <div className="absolute top-[15px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[355px] bg-[#379A7B] z-0" />
                      <div className="absolute top-[17px] left-1/2 transform -translate-x-[47.5%] h-5 w-[349px] bg-[#201c1c] z-0" />
                      <div className="absolute top-[35px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[349px] bg-[#379A7B] z-0" />
                      <div className="flex items-center justify-between relative">
                        {likertLabelsMap[q.metadata.category].map(
                          (label: string, index: number) => (
                            <div
                              key={index}
                              className="flex flex-col items-center text-center"
                            >
                              <div className="w-10 h-10 border-2 rounded-full flex items-center justify-center border-[#379A7B] bg-[#201c1c]">
                                <div className="w-6 h-6 rounded-full bg-[#379A7B]" />
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
          ))}

        <div className="space-y-1 text-light mt-6 mb-6">
          <label
            htmlFor="description"
            className="text-sm font-medium font-bold text-white"
          >
            Comments and Suggestions
          </label>
          <textarea
            readOnly
            className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={deleteFeedbackForm}
            disabled={isLoading}
            className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-charleston"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            onClick={router.back}
            disabled={isLoading}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primarydark disabled:cursor-not-allowed disabled:bg-charleston"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </>
  );
}