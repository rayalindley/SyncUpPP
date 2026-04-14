/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useEffect, useState, useRef } from "react";
import "@yaireo/tagify/dist/tagify.css";
import { toast } from "react-toastify";
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

  // TEMPLATE SYSTEM STATE
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formId, setFormId] = useState<string | null>(null); 
  const [textQuestions, setTextQuestions] = useState<Question[]>([]);
  const [choiceQuestions, setChoiceQuestions] = useState<Question[]>([]);
  const [likertQuestions, setLikertQuestions] = useState<Question[]>([]);
  const [addedQuestions, setAddedQuestions] = useState<string[]>([]);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);
  const [id, setEventId] = useState<string | null>(null);
  
  // NEW: Store organization slug for redirection
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  
  // Track selected question by ID rather than index
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [isRequiredMap, setIsRequiredMap] = useState<Record<string, boolean>>({});

  // Prevent double-execution in React 18 strict mode
  const isFetchingRef = useRef(false);

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
    if (!selectedEvent || isFetchingRef.current) return;

    const fetchEventAndForm = async () => {
      isFetchingRef.current = true;
      try {
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("id, organizationid") 
          .eq("eventslug", selectedEvent)
          .or("is_deleted.eq.false,is_deleted.is.null")
	        .maybeSingle()

        if (eventError || !eventData) {
          console.error("Event fetch error:", eventError);
          return;
        }

        const currentEventId = eventData.id;
        setEventId(currentEventId);

        // Fetch organization slug for redirect
        if (eventData.organizationid) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("slug")
            .eq("organizationid", eventData.organizationid)
            .maybeSingle();

          if (orgData?.slug) {
            setOrgSlug(orgData.slug);
          }
        }

        let currentFormId: string | null = null;
        const { data: form, error: formError } = await supabase
          .from("forms")
          .select("id")
          .eq("slug", selectedEvent)
          .maybeSingle();

        if (form) {
          currentFormId = form.id;
        } else {
          const { data: checkForm } = await supabase
            .from("forms")
            .select("id")
            .eq("slug", selectedEvent)
            .maybeSingle();
            
          if (checkForm) {
            currentFormId = checkForm.id;
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
        }

        setFormId(currentFormId);

        if (currentFormId) {
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
                form_question_id: fq.id,
              }))
            );
            setAddedQuestions(formData.map((fq: any) => String(fq.question_id).trim()));
            
            const requiredMap: Record<string, boolean> = {};
            formData.forEach((fq: any) => {
              requiredMap[String(fq.question_id).trim()] = fq.is_required ?? true;
            });
            setIsRequiredMap(requiredMap);
          }
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchEventAndForm();
  }, [selectedEvent]);

  // 3. TEMPLATE SYSTEM FUNCTIONS
  const handleOpenTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      setIsTemplateModalOpen(true);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please provide a template name");
      return;
    }
    if (formQuestions.length === 0) {
      toast.error("Add some questions before saving a template");
      return;
    }

    try {
      // We save just the array of question IDs
      const templateQuestions = formQuestions.map((q) => String(q.id).trim());

      const { error } = await supabase.from("form_templates").insert([
        {
          name: newTemplateName,
          user_id: userId,
          questions: templateQuestions,
        },
      ]);

      if (error) throw error;

      toast.success("Template saved successfully!");
      setNewTemplateName("");
      // Refresh templates list
      handleOpenTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  const handleApplyTemplate = async (templateQuestionIds: string[]) => {
    setIsLoading(true);
    try {
      // Filter out what is already in addedQuestions
      const toAdd = templateQuestionIds.filter(
        (id) => !addedQuestions.includes(id)
      );

      for (const qId of toAdd) {
        await handleAddQuestion(qId);
      }
      
      toast.success("Template applied successfully!");
      setIsTemplateModalOpen(false);
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply template");
    } finally {
      setIsLoading(false);
    }
  };


  // 4. HANDLE ADDING A QUESTION
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
    const { data: insertedFq, error: insertError } = await supabase.from("form_questions").insert({
      form_id: formId,
      question_id: cleanId,
      question_order: newOrder,
      is_required: true
    }).select().single();

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
      { ...questionData, question_order: newOrder, form_question_id: insertedFq.id },
    ]);
    
    setIsRequiredMap((prev) => ({ ...prev, [cleanId]: true }));
    setActiveQuestionId(cleanId);
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
    if (activeQuestionId === cleanId) setActiveQuestionId(null);
  };

  const handleMoveUpQuestion = async (index: number) => {
    if (index === 0) return;
    const sortedQuestions = [...formQuestions].sort((a, b) => a.question_order - b.question_order);
    const curr = sortedQuestions[index];
    const above = sortedQuestions[index - 1];

    const [res1, res2] = await Promise.all([
      supabase
        .from("form_questions")
        .update({ question_order: above.question_order })
        .eq("id", curr.form_question_id),
      supabase
        .from("form_questions")
        .update({ question_order: curr.question_order })
        .eq("id", above.form_question_id),
    ]);
    if (res1.error || res2.error) return;

    const t = curr.question_order;
    curr.question_order = above.question_order;
    above.question_order = t;
    
    setFormQuestions([...formQuestions]);
  };

  const handleMoveDownQuestion = async (index: number) => {
    if (index === formQuestions.length - 1) return;
    const sortedQuestions = [...formQuestions].sort((a, b) => a.question_order - b.question_order);
    const curr = sortedQuestions[index];
    const below = sortedQuestions[index + 1];

    const [res1, res2] = await Promise.all([
      supabase
        .from("form_questions")
        .update({ question_order: below.question_order })
        .eq("id", curr.form_question_id),
      supabase
        .from("form_questions")
        .update({ question_order: curr.question_order })
        .eq("id", below.form_question_id),
    ]);
    if (res1.error || res2.error) return;

    const t = curr.question_order;
    curr.question_order = below.question_order;
    below.question_order = t;
    
    setFormQuestions([...formQuestions]);
  };

  const toggleRequired = async (questionId: string) => {
    const cleanId = String(questionId).trim();
    const currentVal = isRequiredMap[cleanId] ?? true;
    const newVal = !currentVal;

    // Update UI immediately
    setIsRequiredMap(prev => ({ ...prev, [cleanId]: newVal }));

    // Update in DB
    await supabase
      .from("form_questions")
      .update({ is_required: newVal })
      .eq("form_id", formId)
      .eq("question_id", cleanId);
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

  // NEW SUBMIT FUNCTION
    // NEW SUBMIT FUNCTION
  const handleSubmitForm = async () => {
    setIsLoading(true);

    await Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Successfully Created Feedback Form.",
      confirmButtonText: "Go to Dashboard",
      customClass: {
        title: "text-lg text-white",
        htmlContainer: "text-base text-gray-300",
        popup: "bg-[#1C1C1C] rounded-lg p-6 shadow-xl border border-gray-700",
        confirmButton: "bg-[#379A7B] text-white text-sm px-4 py-2 rounded-md hover:bg-[#2d7d64]",
      },
    });

    setIsLoading(false);
    
    if (orgSlug) {
      // Changed from /dashboard/[slug] to /[slug]/dashboard/events
      router.push(`/${orgSlug}/dashboard`); 
    } else {
      router.push("/dashboard"); // Fallback
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

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setIsAddQModalOpen(true)}
            className="sm:w-full sm:max-w-full bg-[#379A7B] rounded-md text-white font-bold px-4 py-2 flex items-center justify-center gap-2 hover:bg-primarydark"
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

          {/* TEMPLATE BUTTON */}
          <button
            type="button"
            onClick={handleOpenTemplates}
            className="sm:w-full sm:max-w-full bg-[#2D3748] rounded-md text-white font-bold px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#1E3A8A]"
          >
            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 4H6C4.89543 4 4 4.89543 4 5.1V18.9C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18.9V5.1C20 4.89543 19.1046 4 18 4H16M8 4C8 5.10457 8.89543 6 10 6H14C15.1046 6 16 5.10457 16 4M8 4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4M9 10H15M9 14H15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-base/7">Templates</p>
          </button>

          {/* TEMPLATE MODAL */}
          {isTemplateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-[#1C1C1C] p-6 rounded-md shadow-md w-full max-w-md text-white relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Form Templates</h2>
                  <button onClick={() => setIsTemplateModalOpen(false)}>
                    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.9393 12L6.9696 15.9697L8.03026 17.0304L12 13.0607L15.9697 17.0304L17.0304 15.9697L13.0607 12L17.0303 8.03039L15.9696 6.96973L12 10.9393L8.03038 6.96973L6.96972 8.03039L10.9393 12Z" fill="#ffffff" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6 flex gap-2">
                  <input
                    type="text"
                    placeholder="New template name..."
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="border border-[#444444] bg-[#282828] p-2 rounded w-full text-white"
                  />
                  <button 
                    onClick={handleSaveAsTemplate}
                    className="bg-[#379A7B] text-white px-4 py-2 rounded hover:bg-primarydark"
                  >
                    Save
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto bg-[#282828] border border-[#444444] p-2 rounded">
                  {templates.length === 0 ? (
                    <p className="text-gray-400 italic text-sm p-2">No templates saved yet.</p>
                  ) : (
                    templates.map((template) => (
                      <div key={template.id} className="flex justify-between items-center border-b border-[#444444] py-2 last:border-0">
                        <span className="text-white text-sm pl-2">{template.name}</span>
                        <button 
                          onClick={() => handleApplyTemplate(template.questions)}
                          disabled={isLoading}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 mr-2 disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

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
          .map((q, i) => {
            const cleanId = String(q.id).trim();
            const isSelected = activeQuestionId === cleanId;
            
            return (
              <div
                key={cleanId}
                onClick={() => setActiveQuestionId(isSelected ? null : cleanId)}
                className={`space-y-1 text-light mt-4 mb-4 p-2 hover:bg-white/5 transition-all duration-300 ease-in-out ${
                  isSelected
                    ? "bg-white/5 border-t-2 border-primary cursor-default"
                    : "border-t-0 border-transparent cursor-pointer"
                }`}
              >
                {isSelected && (
                  <div className="flex justify-between">
                    <div className="flex justify-start">
                      <label className="inline-flex items-center me-5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isRequiredMap[cleanId] ?? true}
                          onChange={() => toggleRequired(cleanId)}
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
                          handleDeleteQuestion(cleanId);
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
                              d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.4770 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17"
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
                    isSelected ? "cursor-default" : "cursor-pointer"
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
                    <label
                      key={idx}
                      htmlFor={`q${cleanId}c${idx}`}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 cursor-default"
                    >
                      <div className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0" />
                      <span className="text-sm text-white/80 font-light">{choice}</span>
                    </label>
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
            );
          })}

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
          
          {/* UPDATED SUBMIT BUTTON */}
          <button
            type="button"
            onClick={handleSubmitForm}
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