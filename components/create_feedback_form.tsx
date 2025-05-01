import React, { useRef, useEffect, useState } from "react";
import "@yaireo/tagify/dist/tagify.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { MdDragIndicator } from 'react-icons/md'


export default function CreateFeedbackForm() {
  const [isAddQModalOpen, setIsAddQModalOpen] = useState(false);
  const [questionType, setQuestionType] = useState('text');
  const [likertType, setLikertType] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [showFrequency, setShowFrequency] = useState(false);
  const [showImportance, setShowImportance] = useState(false);
  const [showEffectiveness, setShowEffectiveness] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [addedQuestions, setAddedQuestions] = useState<string[]>([]);

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
  

  const handleAddQuestion = (questionText: string) => {
    setAddedQuestions(prev => [...prev, questionText]);
  };


  const [isClicked, setIsClicked] = useState<boolean[]>([]);

  const handleClicked = (index: number) => {
    setIsClicked(prev => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    })
  }

  const choiceQuestions = [
    "How did you hear about this event?",
    "What was your main reason for attending?",
    "Which segment did you find most engaging?",
  ]



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
                  .filter(q=>!addedQuestions.includes(q))
                  .map((questionText, i) => (
                  <>
                    <div key={i} className="flex items-center border border-[#444444]">
                      <button onClick={()=>handleAddQuestion(questionText)}>
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                      </button>
                      <div> {questionText} </div>
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
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <button>
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        </button>
                        <div> The event met my expectations. </div>
                      </div>  
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <button>
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        </button>
                        <div> The speakers were knowledgeable. </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <button>
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        </button>
                        <div> The schedule was well-organized. </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <button>
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        </button>
                        <div> The environment made me feel comfortable. </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <button>
                          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        </button>
                        <div> I would recommend this event to others. </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
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
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you overall? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the registration process? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the food/snacks? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the event's duration? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
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
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How often did you feel engaged during the event? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How often did you interact with other attendees? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How often did you understand the topics being discussed? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
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
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How important was networking in this event for you? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How important was the topic/theme of the event to you? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How important was having interactive segments? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
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
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How effective was the event in delivering its purpose? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How effective were the visual aids and materials used? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How effective were the breakout sessions? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
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
      {addedQuestions.map((question, i) => (
        <div key={i} onClick={()=>handleClicked(i)} className={`space-y-1 text-light mt-4 mb-4 p-2 hover:bg-white/5 transition-all duration-300 ease-in-out ${isClicked[i] === true ? 'bg-white/5 border-t-2 border-primary cursor-default' : ' border-t-0 border-transparent hover:bg-white/5 cursor-pointer'}`}>
          {isClicked[i] === true && (
            <div className="flex justify-end">
              <button className={`${isClicked[i] ? "cursor-pointer disabled" : "cursor-default"}`}><svg className="hover:fill-red ml-2 mr-2" width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg></button>
              <button className={`${isClicked[i] ? "cursor-pointer disabled" : "cursor-default"}`}><svg className="ml-2 mr-2" width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="matrix(-1, 0, 0, -1, 0, 0)"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289L19.7071 10.2929C20.0976 10.6834 20.0976 11.3166 19.7071 11.7071C19.3166 12.0976 18.6834 12.0976 18.2929 11.7071L13 6.41421V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V6.41421L5.70711 11.7071C5.31658 12.0976 4.68342 12.0976 4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929L11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3Z" fill="#ffffff"></path> </g></svg></button>
              <button className={`${isClicked[i] ? "cursor-pointer disabled" : "cursor-default"}`}><svg className="ml-2 mr-2" width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path className={`${i===0 ? "fill-white/50 cursor-default" : "fill-white cursor-pointer"}`} fillRule="evenodd" clipRule="evenodd" d="M12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289L19.7071 10.2929C20.0976 10.6834 20.0976 11.3166 19.7071 11.7071C19.3166 12.0976 18.6834 12.0976 18.2929 11.7071L13 6.41421V20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20V6.41421L5.70711 11.7071C5.31658 12.0976 4.68342 12.0976 4.29289 11.7071C3.90237 11.3166 3.90237 10.6834 4.29289 10.2929L11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3Z" fill="#ffffff"></path> </g></svg></button>
            </div>
          )}
          
          <label className={`text-sm font-medium text-white font-bold ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}>
            {question}
          </label>

          {i === 0 && (
            <div className={`${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}>
              <input disabled id="index1choice1" type="radio" className={`ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}></input>
              <label htmlFor="index1choice1" className={`text-sm font-medium text-white ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}>
                SyncUp++
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className={`ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}></input>
              <label htmlFor="index1choice1" className={`text-sm font-medium text-white ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}>
                Social Media
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className={`ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}></input>
              <label htmlFor="index1choice1" className={`text-sm font-medium text-white ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}>
                A Friend
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className={`ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}></input>
              <label htmlFor="index1choice1" className={`text-sm font-medium text-white ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}>
                School/Work
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className={`ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}></input>
              <label htmlFor="index1choice1" className={`text-sm font-medium text-white ${isClicked[i] ? "cursor-default" : "cursor-pointer"}`}>
                Other
              </label><br></br>
              
            </div>
          )}

          {i === 1 && (
            <div>
              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Learning new things
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Networking
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Supporting a friend/speaker
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Personal interest
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Required to attend
              </label><br></br>
              
            </div>
          )}

          {i === 2 && (
            <div>
              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Opening Ceremony
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Guest Speaker / Talk
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Workshop / Activity
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Games & Prizes
              </label><br></br>

              <input disabled id="index1choice1" type="radio" className="ml-2 mr-2 border-gray-300 text-primary focus:ring-primarydark cursor-pointer"></input>
              <label htmlFor="index1choice1" className="text-sm font-medium text-white cursor-pointer">
                Closing Remarks
              </label><br></br>
              
            </div>
          )}
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
    </div>
    </>
  );
}