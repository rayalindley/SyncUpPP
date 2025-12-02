"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";

const faqs = [
  {
    question: "How does SyncUp++ work?",
    answer: `SyncUp++ is an all-in-one event management platform designed to help communities organize, manage, and evaluate events easily. 

    With SyncUp++, users can create communities, host and schedule events, distribute evaluation forms with both open-ended and Likert scale questions, and analyze feedback using built-in sentiment analysis. 
    
    Plus, participants can receive virtual certificates for attending events — making the entire experience smooth and professional.`

  },
  {
    question: "How do evaluation forms work?",
    answer:
      `Evaluation forms in SyncUp++ help you collect feedback after an event. 
      
      You can add both open-ended questions and Likert scale items to measure satisfaction, engagement, and other metrics. These responses are also analyzed by our sentiment model to give you insights into how participants felt about your event.`
  },
  {
    question: "How do I create an organization?",
    answer: `To create an organization, open the left sidebar, click the dropdown, and select "Create Organization".


Follow these 4 steps:

1. Basic Info: Name, description, image, type, sector, size, website, and access settings.

2. Address: Enter your organization’s location.

3. Social Links: Add Facebook, Instagram, etc.

4. Review: Check your details and submit.`,
  },
  {
    question: "How do I create an event?",
    answer: `Community Owners can create events from their dashboard.
    
    Navigate through the sidebar , select which organization you want that will handle the event ,. 
    
    after which you can go to the Event , there you'll find the "Create Event" button , Fill in event details, schedule, and upload resources`,
  },
  {
    question: "How to delete Organization?",
    answer: `You can delete your community by selecting it from the sidebar, opening its Overview section, and scrolling down. 
    
    There you’ll see the Delete Organization button.

        Note: Only community owners can do this, and once deleted, the data can’t be recovered.`
  },
  {
    question: "How to join a community?",
    answer: `You can browse available communities under the 'Communities' tab.

     Click 'Join' on any public community you’re interested in!`
  },
  {
     question: "How to join an event?",
    answer: `To register for an event, go to the Event Page. 
    
    You’ll see a list of all ongoing and upcoming events. 
    
    Click on one to view more details — like the location, date and time, type of event, and whether it’s still open for registration.

You’ll also find info on whether it’s a free or paid event. 

Once you find one you’re interested in, just click Register to sign up!

You can also use filters to narrow down events based on your interests.`
  }
 
];

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const toggleFAQ = (index: number) =>
    setOpenIndex(openIndex === index ? null : index);

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-light mb-6">
        Frequently Asked Questions
      </h1>

      {/* 🔍 Search Bar */}
      <input
        type="text"
        placeholder="Search FAQs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full rounded-md border border-fadedgrey bg-charleston p-3 text-light placeholder-gray-400"
      />

      <div className="space-y-4">
        {filteredFaqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-md border border-fadedgrey bg-charleston p-4"
          >
            <button
              onClick={() => toggleFAQ(i)}
              className="flex w-full justify-between text-left text-light font-semibold"
            >
              <span>{faq.question}</span>
              {openIndex === i ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {openIndex === i && (
              <p className="mt-2 whitespace-pre-line text-gray-300">
                {faq.answer}
              </p>
            )}
          </div>
        ))}

        {/* If no search results */}
        {filteredFaqs.length === 0 && (
          <p className="text-gray-400 text-sm">No FAQs found.</p>
        )}
      </div>
    </div>
  );
}