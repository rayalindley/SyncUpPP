/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useEffect, useState } from "react";
import "@yaireo/tagify/dist/tagify.css";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import { Question } from "@/types/questions";
import { useRouter } from "next/navigation";
import { CiShare2 } from "react-icons/ci";
import { FaRegEye } from "react-icons/fa";


const supabase = createClient();

export default function FeedbackFormOrganizer({
  selectedEvent,
  userId,
}: {
  selectedEvent: any;
  userId: any;
}) {
  // const { eventslug } = useParams() as { eventslug: string };
  const [isAddQModalOpen, setIsAddQModalOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]); // here
  const [questionType, setQuestionType] = useState('text'); //here
  const [likertType, setLikertType] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [showFrequency, setShowFrequency] = useState(false);
  const [showImportance, setShowImportance] = useState(false);
  const [showEffectiveness, setShowEffectiveness] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formId, setFormId] = useState<number | null>(null);
  const [choiceQuestions, setChoiceQuestions] = useState<Question[]>([]);
  const [likertQuestions, setLikertQuestions] = useState<Question[]>([]);
  const [addedQuestions, setAddedQuestions] = useState<number[]>([]);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);

  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("eventid")
        .eq("eventslug", selectedEvent)
        .single();

      if (data) {
        setEventId(data.eventid);
      }
    };

    fetchEvent();
  }, [selectedEvent]);

  useEffect(() => {
    if(!eventId) return;

    const fetchFormAndQuestions = async () => {
      let fetchedFormId: number | null = null;

      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('id')
        .eq('slug', selectedEvent)
        .single();

      if (form && !formError) {
        fetchedFormId = form.id;
      } else {
        const { data: newForm, error: insertError } = await supabase
          .from('forms')
          .insert([{ event_id: eventId, slug: selectedEvent}])
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
  }, [selectedEvent, eventId]);


  const handleAddQuestion = async(questionId: number) => {
    if (!formId) return;

    const { data: existingQuestions } = await supabase
      .from('form_questions')
      .select('*')
      .eq('form_id', formId);

    const newOrder = existingQuestions?.length;

    const { error } = await supabase.from('form_questions').insert({
      form_id: formId,
      question_id: questionId,
      question_order: newOrder
    });
  
    if (error) {
      console.error('Error adding question to form:', error);
      return;
    }

    const { data: questionData, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (fetchError || !questionData) {
      console.error('Error fetching added question data:', fetchError);
      return;
    }
  
    setFormQuestions(prev => [...prev, { ...questionData, question_order: newOrder }]);
    setAddedQuestions(prev => [...prev, questionId]);
  };
  
  const handleDeleteQuestion = async(questionId: number) => {
    if(!formId) return;

    const { error: deleteError } = await supabase
      .from('form_questions')
      .delete()
      .eq('question_id', questionId)
      .eq('form_id', formId);

    if(deleteError) {
      console.error("Error deleting question");
      return;
    }

    const { data: remaining, error: fetchError } = await supabase
      .from('form_questions')
      .select('id')
      .eq('form_id', formId)
      .order('question_order', { ascending: true });

    if (fetchError) {
      console.error("Error fetching remaining questions:", fetchError);
      return;
    }

    for(let i = 0; i < remaining.length; i++) {
      const { error: updateError } = await supabase
        .from('form_questions')
        .update({ question_order: i })
        .eq('id', remaining[i].id);

      if (updateError) {
        console.error("Error updating question_order:", updateError);
      }
    }

    setFormQuestions(prev => prev.filter(q => q.id !== questionId));
    setAddedQuestions(prev => prev.filter(id => id !== questionId));
  }

  const handleMoveUpQuestion = async (index: number) => {
    if (index === 0) return;

    const curr = formQuestions[index];
    const above = formQuestions[index - 1];

    const updates = [
      supabase
        .from('form_questions')
        .update({ question_order: above.question_order })
        .eq('question_id', curr.id)
        .eq('form_id', formId),
      supabase
        .from('form_questions')
        .update({ question_order: curr.question_order })
        .eq('question_id', above.id)
        .eq('form_id', formId),
    ];

    const [res1, res2] = await Promise.all(updates);

    if (res1.error || res2.error) {
      console.error('Error swapping question order', res1.error || res2.error);
      return;
    }

    const updated = [...formQuestions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];

    const tempOrder = updated[index].question_order;
    updated[index].question_order = updated[index - 1].question_order;
    updated[index - 1].question_order = tempOrder;

    setFormQuestions(updated.sort((a, b) => a.question_order - b.question_order));
  };

  const handleMoveDownQuestion = async(index: number) => {
    if(index === formQuestions?.length-1) return;

    const curr = formQuestions[index];
    const below = formQuestions[index+1];

    const updates = [
      supabase.from('form_questions')
        .update({question_order: below.question_order})
        .eq('question_id', curr.id)
        .eq('form_id', formId),
      supabase.from('form_questions')
        .update({question_order: curr.question_order})
        .eq('question_id', below.id)
        .eq('form_id', formId)
    ];

    const [res1, res2] = await Promise.all(updates);

    if (res1.error || res2.error) {
      console.error('Error swapping question order', res1.error || res2.error);
      return;
    }

    const updated = [...formQuestions];
    [updated[index], updated[index+1]] = [updated[index+1], updated[index]];

    const tempOrder = updated[index].question_order;
    updated[index].question_order = updated[index+1].question_order;
    updated[index+1].question_order = tempOrder;

    setFormQuestions(updated.sort((a, b) => a.question_order - b.question_order));
  }

  const [isClicked, setIsClicked] = useState<boolean[]>([]);

  const handleClicked = (index: number) => {
    setIsClicked(prev => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    })
  }

  useEffect(() => {
    console.log("Saving to localStorage: ", addedQuestions);
    localStorage.setItem('addedQuestions', JSON.stringify(addedQuestions));
  }, [addedQuestions]);

  useEffect(() => {
    const stored = localStorage.getItem('addedQuestions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log("Loaded from localStorage:", parsed);
        setAddedQuestions(parsed);
      } catch (err) {
        console.error("Error parsing stored questions:", err);
      }
    }
  }, []);

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


  return (
    <>
    <div>
      {/* Button to Open Add Question Modal */}
      <div className="flex justify-center">
        <button onClick={()=>setIsAddQModalOpen(true)} className="sm:w-full sm:max-w-full bg-[#379A7B] rounded-md text-white font-bold px-4 py-2 flex item-center gap-2 hover:bg-primarydark">
          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12.75 9C12.75 8.58579 12.4142 8.25 12 8.25C11.5858 8.25 11.25 8.58579 11.25 9L11.25 11.25H9C8.58579 11.25 8.25 11.5858 8.25 12C8.25 12.4142 8.58579 12.75 9 12.75H11.25V15C11.25 15.4142 11.5858 15.75 12 15.75C12.4142 15.75 12.75 15.4142 12.75 15L12.75 12.75H15C15.4142 12.75 15.75 12.4142 15.75 12C15.75 11.5858 15.4142 11.25 15 11.25H12.75V9Z" fill="#ffffff"></path> </g></svg>
          <p className="text-base/7"> Add question </p>      
        </button>

        {/* Add Question Modal */}
        {isAddQModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#1C1C1C] p-6 rounded-md shadow-md w-full max-w-md text-white relative overflow-y-auto">
              <div className="flex items-center justify-center mb-4 relative">
                <h2 className="text-m font-semibold text-white">Add question</h2>
                <button onClick={() => setIsAddQModalOpen(false)} className="absolute right-0">
                  <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fillRule="evenodd" clipRule="evenodd" d="M10.9393 12L6.9696 15.9697L8.03026 17.0304L12 13.0607L15.9697 17.0304L17.0304 15.9697L13.0607 12L17.0303 8.03039L15.9696 6.96973L12 10.9393L8.03038 6.96973L6.96972 8.03039L10.9393 12Z" fill="#ffffff"/> </svg>
                </button>
              </div>

              <div className="flex justify-between items-center pl-6 pr-6 mb-6">
                <button onClick={()=>setQuestionType('text')} className={`${questionType === 'text' ? 'border-b-4 border-white font-bold' : 'border-b-4 border-transparent'}`}> Text </button>
                <button onClick={()=>setQuestionType('choice')} className={`${questionType==='choice' ? 'border-b-4 border-white font-bold' : 'border-b-4 border-transparent'}`}> Choice </button>
                <button onClick={()=>setQuestionType('likert')} className={`${questionType==='likert' ? 'border-b-4 border-white font-bold' : 'border-b-4 border-transparent'}`}> Likert </button>
              </div>

              {/* Text Questions */}
              {questionType === 'text' && (
                <>
                <div className="bg-[#282828]">
                  <div className="flex items-center border border-[#444444]">
                    <button>
                      <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                    </button>
                    <div> Full Name </div>
                  </div>

                  <div className="flex items-center border border-[#444444]">
                    <button>
                      <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                    </button>
                    <div> First Name </div>
                  </div>

                  <div className="flex items-center border border-[#444444]">
                    <button>
                      <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                    </button>
                    <div> Last Name </div>
                  </div>

                  <div className="flex items-center border border-[#444444]">
                    <button>
                      <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                    </button>
                    <div> Middle Name </div>
                    </div>
                  </div>
                </>
              )}
              

              {/* Choice Questions */}
              {questionType === 'choice' && (
                <div className="bg-[#282828]">
                  {choiceQuestions
                    .filter(q=>!addedQuestions.includes(q.id))
                    .map((q) => (
                    <>
                      <div key={q.id} className="flex items-center border border-[#444444]">
                        <button onClick={()=>handleAddQuestion(q.id)}>
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        </button>
                        <div> {q.question_text} </div>
                      </div>
                    </>
                  ))}
                      
                  <div className="flex items-center border border-[#444444]">
                    <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                    <div className="italic text-sm"> Custom Question </div>
                    <div className="italic text-xs ml-auto pr-3"> PAID </div>
                  </div>
                </div>
              )}

              {/* Likert Questions */}
              {questionType === 'likert' && (
                <div className="max-h-[500px] overflow-y-auto bg-[#282828] border border-[#444444]">
                  <div>
                    <button onClick={() => setShowAgreement(prev => !prev)} className="flex justify-between w-full items-center p-2">
                      <p> Agreement-Based Questions </p>
                      <svg className={`right-0 ${showAgreement ? 'scale-y-100' : '-scale-y-100'}`} width="15px" height="15px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z"></path></g></svg>
                    </button>

                    {showAgreement && (
                      <>
                        {likertQuestions
                          .filter((q)=>q.likert_category === 'Agreement' && !addedQuestions.includes(q.id))
                          .map((q) => (
                            <>
                            <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                              <button onClick={()=>handleAddQuestion(q.id)}>
                                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                              </button>
                              <div> {q.question_text} </div>
                            </div>
                            </>
                        ))}

                        <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                          <div className="italic text-sm"> Custom Question </div>
                          <div className="italic text-xs ml-auto pr-3"> PAID </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <button onClick={()=>setShowSatisfaction(prev=>!prev)} className="flex justify-between items-center w-full p-2">
                      <p> Satisfaction-Based Questions </p>
                      <svg className={`right-0 ${showSatisfaction ? 'scale-y-100' : '-scale-y-100'}`} width="15px" height="15px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z"></path></g></svg>
                    </button>

                    {showSatisfaction && (
                      <>
                        {likertQuestions
                          .filter((q)=>q.likert_category === 'Satisfaction' && !addedQuestions.includes(q.id))
                          .map((q) => (
                            <>
                            <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                              <button onClick={()=>handleAddQuestion(q.id)}>
                                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                              </button>
                              <div> {q.question_text} </div>
                            </div>
                            </>
                        ))}

                        <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                          <div className="italic text-sm"> Custom Question </div>
                          <div className="italic text-xs ml-auto pr-3"> PAID </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <button onClick={()=>setShowFrequency(prev=>!prev)} className="flex justify-between items-center w-full p-2 border-1">
                      <p> Frequency-Based Questions </p>
                      <svg className={`${showFrequency ? 'scale-y-100' : '-scale-y-100'}`} width="15px" height="15px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z"></path></g></svg>
                    </button>

                    {showFrequency && (
                      <>
                        {likertQuestions
                          .filter((q)=>q.likert_category === 'Frequency' && !addedQuestions.includes(q.id))
                          .map((q) => (
                            <>
                            <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                              <button onClick={()=>handleAddQuestion(q.id)}>
                                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                              </button>
                              <div> {q.question_text} </div>
                            </div>
                            </>
                        ))}

                        <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                          <div className="italic text-sm"> Custom Question </div>
                          <div className="italic text-xs ml-auto pr-3"> PAID </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <button onClick={()=>setShowImportance(prev=>!prev)} className="flex justify-between items-center w-full p-2 border-1">
                      <p> Importance-Based Questions </p>
                      <svg className={`${showFrequency ? 'scale-y-100' : '-scale-y-100'}`} width="15px" height="15px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z"></path></g></svg>
                    </button>

                    {showImportance && (
                      <>
                        {likertQuestions
                          .filter((q)=>q.likert_category === 'Importance' && !addedQuestions.includes(q.id))
                          .map((q) => (
                            <>
                            <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                              <button onClick={()=>handleAddQuestion(q.id)}>
                                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                              </button>
                              <div> {q.question_text} </div>
                            </div>
                            </>
                        ))}

                        <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                          <div className="italic text-sm"> Custom Question </div>
                          <div className="italic text-xs ml-auto pr-3"> PAID </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <button onClick={()=>setShowEffectiveness(prev=>!prev)} className="flex justify-between items-center w-full p-2 border-1">
                      <p> Effectiveness-Based Questions </p>
                      <svg className={`${showFrequency ? 'scale-y-100' : '-scale-y-100'}`} width="15px" height="15px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z"></path></g></svg>
                    </button>

                    {showEffectiveness && (
                      <>
                        {likertQuestions
                          .filter((q)=>q.likert_category === 'Effectiveness' && !addedQuestions.includes(q.id))
                          .map((q) => (
                            <>
                            <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                              <button onClick={()=>handleAddQuestion(q.id)}>
                                <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                              </button>
                              <div> {q.question_text} </div>
                            </div>
                            </>
                        ))}

                        <div className="flex items-center pl-2 bg-[#1D1C1C] border border-[#444444]">
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                          <div className="italic text-sm"> Custom Question </div>
                          <div className="italic text-xs ml-auto pr-3"> PAID </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Added Questions */}
      {formQuestions
        .sort((a, b) => a.question_order - b.question_order)
        .map((q, i) => (
          <div
            key={i}
            onClick={() => handleClicked(i)}
            className={`space-y-1 text-light mt-4 mb-4 p-2 hover:bg-white/5 transition-all duration-300 ease-in-out ${isClicked[i] ? 'bg-white/5 border-t-2 border-primary cursor-default' : 'border-t-0 border-transparent cursor-pointer'}`}>
            {isClicked[i] && (
              <div className="flex justify-between">
                <div className="flex justify-start">
                  <button>
                    <label className={`inline-flex items-center me-5 ${isClicked[i] ? "cursor-pointer disabled" : "cursor-default"}`}>
                      <input type="checkbox" value="" className="sr-only peer" checked onChange={() => {
                        const newToggles = [...isRequired];
                        newToggles[i] = !newToggles[i];
                        setIsRequired(newToggles);}}/>
                      <div className="ml-2 relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                      <span className="ms-3 text-xs font-medium text-white-900 mr-2"> Required </span>
                    </label>
                  </button>
                </div>

                <div className="flex justify-end">
                  <button onClick={()=>handleDeleteQuestion(q.id)} className={`${isClicked[i] ? "cursor-pointer disabled" : "cursor-default"}`}><svg className="hover:fill-red ml-2 mr-2" width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg></button>
                  <button onClick={()=>handleMoveDownQuestion(i)} className={`${isClicked[i] ? "cursor-pointer disabled" : "cursor-default"}`}><svg className="ml-2 mr-2" width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="matrix(-1, 0, 0, -1, 0, 0)"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path className={`${i===addedQuestions?.length-1 ? "fill-white/50 cursor-default" : "fill-white cursor-pointer"}`} fillRule="evenodd" clipRule="evenodd" d="M12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289L19.7071 10.2929C20.0976 10.6834 20.0976 11.3166 19.7071 11.7071C19.3166 12.0976 18.6834 12.0976 18.2929 11.7071L13 6.41421V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V6.41421L5.70711 11.7071C5.31658 12.0976 4.68342 12.0976 4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929L11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3Z" fill="#ffffff"></path> </g></svg></button>
                  <button onClick={()=>handleMoveUpQuestion(i)} className={`${isClicked[i] ? "cursor-pointer disabled" : "cursor-default"}`}><svg className="ml-2 mr-2" width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path className={`${i===0 ? "fill-white/50 cursor-default" : "fill-white cursor-pointer"}`} fillRule="evenodd" clipRule="evenodd" d="M12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289L19.7071 10.2929C20.0976 10.6834 20.0976 11.3166 19.7071 11.7071C19.3166 12.0976 18.6834 12.0976 18.2929 11.7071L13 6.41421V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V6.41421L5.70711 11.7071C5.31658 12.0976 4.68342 12.0976 4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929L11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3Z" fill="#ffffff"></path> </g></svg></button>
                </div>
              </div>
            )}

            {/* Question Text */}
            <label className={`text-sm font-medium text-white font-bold ${isClicked[i] ? 'cursor-default' : 'cursor-pointer'}`}>
              {q.question_text}
            </label>

            {q.question_type === 'Choice' && q.choices?.map((choice: string, i: number) => (
              <div key={i} className={isClicked[i] ? 'cursor-default' : 'cursor-pointer'}>
                <input disabled id={`index${i}choice1`} type="radio" className={`ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark ${isClicked[i] ? 'cursor-default' : 'cursor-pointer'}`}/>
                <label htmlFor={`index${i}choice1`} className={`text-sm font-medium font-light text-white ${isClicked[i] ? 'cursor-default' : 'cursor-pointer'}`}>
                  {choice}
                </label>
                <br />
              </div>
            ))}

            {q.question_type === 'Likert' && likertLabelsMap[q.likert_category] && (
              <div className={isClicked[i] ? 'cursor-default' : 'cursor-pointer'}>
                <div className="relative w-full max-w-4xl mx-auto px-4 py-2">
                  <div className="absolute top-[15px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[355px] bg-[#379A7B] z-0" />
                  <div className="absolute top-[17px] left-1/2 transform -translate-x-[47.5%] h-5 w-[349px] bg-[#201c1c] z-0" />
                  <div className="absolute top-[35px] left-1/2 transform -translate-x-[47.5%] h-0.5 w-[349px] bg-[#379A7B] z-0" />

                  <div className={`flex items-center justify-between relative ${isClicked[i] ? 'cursor-default' : 'cursor-pointer'}`}>
                    {likertLabelsMap[q.likert_category].map((label, index) => (
                      <div key={index} className={`flex flex-col items-center text-center ${isClicked[i] ? 'cursor-default' : 'cursor-pointer'} ${isClicked[i] ? 'cursor-default' : 'cursor-pointer'}`}>
                        <div onClick={() => setSelected(index)} className={`w-10 h-10 border-2 rounded-full flex items-center justify-center cursor-pointer transition-colors ${selected === index ? "border-[#379A7B] bg-[#201c1c]" : "border-[#379A7B] bg-[#201c1c]"} ${isClicked[i] ? 'cursor-default' : 'cursor-pointer'}`}>
                          <div className={`w-6 h-6 rounded-full ${selected === index ? "bg-[#379A7B]" : "bg-[#379A7B]"} ${isClicked[i] ? 'cursor-default' : 'cursor-pointer'}`}/>
                        </div>
                        <p className="text-[10px] italic text-white w-24 mt-2">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* form for the attendees */}
            {/* {q.question_type === 'Likert' && (
              q.likert_category === 'Agreement' && (
              <div className={isClicked[i] ? 'cursor-default' : 'cursor-pointer'}>
                <div className="relative w-full max-w-4xl mx-auto px-6 py-8">
                  <div className="absolute top-[30px] left-0 right-0 h-1 bg-[#379A7B] z-0" />

                  <div className="flex items-center justify-between relative z-10">
                    {agreementLabels.map((label, index) => (
                      <div key={index} className="flex flex-col items-center text-center space-y-2">
                        <div
                          className={`w-10 h-10 border-2 rounded-full flex items-center justify-center cursor-pointer transition-colors
                            ${selected === index ? "border-[#379A7B]" : "border-[#379A7B]"}
                          `}
                          onClick={() => setSelected(index)}
                        >
                          <div
                            className={`w-5 h-5 rounded-full
                              ${selected === index ? "bg-[#379A7B]" : "border-[#379A7B]"}
                            `}
                          />
                        </div>
                        <p className="text-sm italic text-white w-24">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))} */}
          </div>
        ))}

      {/* Comments and Suggestions TextArea */}
      <div className="space-y-1 text-light mt-6 mb-6">
        <label htmlFor="description" className="text-sm font-medium font-bold text-white">
          Comments and Suggestions
        </label>
        <textarea readOnly className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"></textarea>
        {/* <textarea
          id="description"
          {...register("description")}
          className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
        />
        {errors.description && isSubmitted && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )} */}
      </div>
      
      <div className="flex justify-between">
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={()=>deleteFeedbackForm()}
              type="submit"
              disabled={isLoading}
              className="flex justify-end rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-charleston"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </button>
          </div>

          <div className="flex">
            <button className="flex items-center group relative rounded-md bg-gray-700 px-3 py-1.5 mr-1" onclick={()=> router.push(`/feedback/${selectedEvent}`)}>
              <FaRegEye color="white" className="text-2xl" />
              <div className="text-white ml-1 text-md"> Preview </div>
            </button>

            <button className="flex items-center group relative rounded-md bg-gray-700 px-3 py-1.5 ml-1" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert("Copied feedback form link!"))}>
              <CiShare2 color="white" className="text-2xl" />
              <div className="text-white ml-1 text-md">Share</div>
            </button>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={router.back}
              type="submit"
              disabled={isLoading}
              className="flex justify-end rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-charleston"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
      </div>
      
    </div>
    </>
  );
}