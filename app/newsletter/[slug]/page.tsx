"use client";

// NewsletterPage.js
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/context/UserContext";
import { useParams } from "next/navigation";
import {
  fetchMembers,
  sendNewsletter,
  getOrganizationNameBySlug,
} from "@/lib/newsletterActions";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

export default function NewsletterPage() {
  const { user } = useUser();
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editorState, setEditorState] = useState("");
  const [subject, setSubject] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("onboarded@resend.dev");
  const [attachments, setAttachments] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const params = useParams();

  useEffect(() => {
    if (params.slug) {
      getOrganizationNameBySlug(params.slug as string).then((result) => {
        if (result.name) {
          setSenderName(result.name);
        }
      });
    }
  }, [params.slug]);

  useEffect(() => {
    async function getMembers() {
      const slug = params.slug; // Get the slug from the URL
      const members = await fetchMembers(slug);
      setMembers(members);
    }

    getMembers();
  }, [params.slug]);

  const handleCheckboxChange = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendNewsletter = async () => {
    console.log("Sending newsletter to selected members:", selectedMembers);
    for (const memberId of selectedMembers) {
      const member = members.find((m) => m.id === memberId);
      if (member) {
        const attachmentPromises = attachments.map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              // Extract the base64 content from the result
              const base64Content = e.target.result.split(',')[1];
              resolve({ filename: file.name, content: base64Content });
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file); // Reads the file as a data URL (base64 encoded string)
          });
        });
  
        const resolvedAttachments = await Promise.all(attachmentPromises);
  
        const emailContent = {
          from: `${senderName} <${senderEmail}>`,
          to: member.email,
          subject: subject,
          html: editorState,
          attachments: resolvedAttachments,
        };
  

        console.log("Sending newsletter to:", member.email);
        console.log("Email content:", emailContent);

        await sendNewsletter(emailContent);
      }
    }
  };

  const handleAttachmentChange = (event) => {
    if (event.target.files) {
      setAttachments(Array.from(event.target.files));
    }
  };

  const handleSubjectChange = (event) => {
    setSubject(event.target.value);
  };

  const handleSearchQueryChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const onEditorStateChange = (value) => {
    setEditorState(value);
  };

  const togglePreview = () => {
    setPreviewOpen(!previewOpen);
  };

  // Only display the first 5 filtered members
  const displayedMembers = filteredMembers.slice(0, 5);

  
  return (
    <div className="bg-charleston p-5 font-sans text-light">
      <h1 className="border-b border-[#525252] pb-2">Newsletter Creation</h1>

      <div className="my-5">
        <label htmlFor="senderName" className="mb-1 block">
          From - Organization Name:
        </label>
        <input
          id="senderName"
          type="text"
          placeholder="Organization Name"
          value={senderName}
          disabled
          className="w-full border-none bg-[#525252] p-2 text-white"
        />
      </div>

      <div className="my-5">
        <input
          id="senderEmail"
          type="email"
          placeholder="Organization Email"
          value={senderEmail}
          disabled
          hidden
          className="w-full border-none bg-[#525252] p-2 text-white"
        />
      </div>

      <div id="recipients" className="my-5">
        <h2 className="border-b border-[#525252] pb-2">Recipients:</h2>
        <input
          id="searchMembers"
          type="text"
          placeholder="Search Members..."
          value={searchQuery}
          onChange={handleSearchQueryChange}
          className="my-2 w-full border-none bg-[#525252] p-2 text-white"
        />
        <div>
          {displayedMembers.map((member) => (
            <div key={member.id} className="my-2">
              <input
                type="checkbox"
                checked={selectedMembers.includes(member.id)}
                onChange={() => handleCheckboxChange(member.id)}
                className="mr-2"
              />
              <span>{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="my-5">
        <label htmlFor="subject" className="mb-1 block">
          Subject:
        </label>
        <input
          id="subject"
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={handleSubjectChange}
          className="w-full border-none bg-[#525252] p-2 text-white"
        />
      </div>

      <div className="my-5">
        <label htmlFor="editor" className="mb-1 block">
          Message:
        </label>
        <ReactQuill
          id="editor"
          theme="snow"
          value={editorState}
          onChange={onEditorStateChange}
          className="bg-[#525252] text-white"
        />
      </div>

      <div className="my-5">
        <label htmlFor="attachments" className="mb-1 block">
          Attachments:
        </label>
        <input
          id="attachments"
          type="file"
          multiple
          onChange={handleAttachmentChange}
          className="w-full border-none bg-[#525252] p-2 text-white"
        />
      </div>

      <div className="my-5 flex items-center justify-between">
        <button
          onClick={handleSendNewsletter}
          className="cursor-pointer rounded border-none bg-primary px-4 py-2 text-white"
        >
          Send Newsletter
        </button>
        <button
          onClick={togglePreview}
          className="cursor-pointer rounded border-none bg-primary px-4 py-2 text-white"
        >
          {previewOpen ? "Close Preview" : "Preview Newsletter"}
        </button>
      </div>

      {previewOpen && (
        <div className="mt-5 bg-[#525252] p-5 text-white">
          <h2>Newsletter Preview</h2>
          <div dangerouslySetInnerHTML={{ __html: editorState }} />
        </div>
      )}
    </div>
  );
}
