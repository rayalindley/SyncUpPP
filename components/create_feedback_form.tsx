import React, { useRef, useEffect, useState } from "react";
import SignaturePad from "react-signature-canvas";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Tagify from "@yaireo/tagify";
import TagsInput from "./custom/tags-input";
import Select, { MultiValue } from "react-select";
import "@yaireo/tagify/dist/tagify.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PhotoIcon, PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { insertEvent, updateEvent } from "@/lib/events";
import { getUser, createClient } from "@/lib/supabase/client";
import { recordActivity } from "@/lib/track";
import { set } from "date-fns";
import Swal from "sweetalert2";

import { useParams } from "next/navigation";

// Validation Schema

export default function CreateFeedbackForm() {
  const [isAddQModalOpen, setIsAddQModalOpen] = useState(false);
  const [questionType, setQuestionType] = useState('text');
  const [likertType, setLikertType] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [showFrequency, setShowFrequency] = useState(false);


  return (
    <div>
      {/* Button to Open Add Question Modal */}
      <div className="flex justify-center">
        <button onClick={()=>setIsAddQModalOpen(true)} className="sm:w-full sm:max-w-full bg-[#379A7B] rounded-md text-white font-bold px-4 py-2 flex item-center gap-2 hover:bg-primarydark">
          <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12.75 9C12.75 8.58579 12.4142 8.25 12 8.25C11.5858 8.25 11.25 8.58579 11.25 9L11.25 11.25H9C8.58579 11.25 8.25 11.5858 8.25 12C8.25 12.4142 8.58579 12.75 9 12.75H11.25V15C11.25 15.4142 11.5858 15.75 12 15.75C12.4142 15.75 12.75 15.4142 12.75 15L12.75 12.75H15C15.4142 12.75 15.75 12.4142 15.75 12C15.75 11.5858 15.4142 11.25 15 11.25H12.75V9Z" fill="#ffffff"></path> </g></svg>
          <p className="text-base/7"> Add question </p>      
        </button>

        {/* Add Question Modal */}
        {isAddQModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#1C1C1C] p-6 rounded-md shadow-md w-full max-w-md text-white relative overflow-y-auto">
              <div className="flex items-center justify-center mb-4 relative">
                <h2 className="text-m font-semibold text-white">Add question</h2>
                <button onClick={() => setIsAddQModalOpen(false)} className="absolute right-0">
                  <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.9393 12L6.9696 15.9697L8.03026 17.0304L12 13.0607L15.9697 17.0304L17.0304 15.9697L13.0607 12L17.0303 8.03039L15.9696 6.96973L12 10.9393L8.03038 6.96973L6.96972 8.03039L10.9393 12Z" fill="#ffffff"/> </svg>
                </button>
              </div>

              <div className="flex justify-between items-center pl-6 pr-6 mb-6">
                <button onClick={()=>setQuestionType('text')} className={`${questionType === 'text' ? 'border-b-4 border-white font-bold' : 'border-b-4 border-transparent'}`}> Text </button>
                <button onClick={()=>setQuestionType('choice')} className={`${questionType==='choice' ? 'border-b-4 border-white font-bold' : 'border-b-4 border-transparent'}`}> Choice </button>
                <button onClick={()=>setQuestionType('likert')} className={`${questionType==='likert' ? 'border-b-4 border-white font-bold' : 'border-b-4 border-transparent'}`}> Likert </button>
              </div>

              {/* Text Questions */}
              {questionType === 'text' && (
                <div>
                  <div>
                    Full Name
                  </div>
                </div>
              )}
              

              {/* Choice Questions */}
              {questionType === 'choice' && (
                <div>
                  choice
                </div>
              )}

              {/* Likert Questions */}
              {questionType === 'likert' && (
                <div className="bg-[#282828] border border-[#444444]">
                  <div>
                    <button onClick={() => setShowAgreement(prev => !prev)} className="flex justify-between w-full items-center p-2">
                      <p> Agreement-Based Questions </p>
                      <svg className={`right-0 ${showAgreement ? 'scale-y-100' : '-scale-y-100'}`} width="15px" height="15px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z"></path></g></svg>
                    </button>

                    {showAgreement && (
                      <>
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <button onClick={()=>setShowSatisfaction(prev=>!prev)} className="flex justify-between items-center w-full p-2">
                      <p> Satisfaction-Based Questions </p>
                      <svg className={`right-0 ${showSatisfaction ? 'scale-y-100' : '-scale-y-100'}`} width="15px" height="15px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z"></path></g></svg>
                    </button>

                    {showSatisfaction && (
                      <>
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <button onClick={()=>setShowFrequency(prev=>!prev)} className="flex justify-between items-center w-full p-2 border-1">
                      <p> Frequency-Based Questions </p>
                      <svg className={`${showFrequency ? 'scale-y-100' : '-scale-y-100'}`} width="15px" height="15px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M8 1.25a2.101 2.101 0 00-1.785.996l.64.392-.642-.388-5.675 9.373-.006.01a2.065 2.065 0 00.751 2.832c.314.183.67.281 1.034.285h11.366a2.101 2.101 0 001.791-1.045 2.064 2.064 0 00-.006-2.072L9.788 2.25l-.003-.004A2.084 2.084 0 008 1.25z"></path></g></svg>
                    </button>

                    {showFrequency && (
                      <>
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
                      </div>
                      
                      <div className="flex items-center pl-2 bg-[#1D1C1C]">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 12.75V18H12.75V12.75H18V11.25H12.75V6H11.25V11.25H6V12.75H11.25Z" fill="#ffffff"></path> </g></svg>
                        <div> How satisfied were you with the venue? </div>
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
    </div>
  );
}