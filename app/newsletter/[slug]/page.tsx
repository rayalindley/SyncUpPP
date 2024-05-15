"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/context/UserContext";
import { useParams } from "next/navigation";
import {
  fetchMembers,
  sendNewsletter,
  getOrganizationNameBySlug,
} from "@/lib/newsletterActions";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


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
  const [isInputFocused, setIsInputFocused] = useState(false);
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

  const handleMemberSelect = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers?.filter((id) => id !== memberId));
    } else {
      setSelectedMembers([memberId, ...selectedMembers]);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const filteredMembers = members?.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedMembers.includes(member.id)
  );

  const handleSendNewsletter = async () => {
    for (const memberId of selectedMembers) {
      const member = members.find((m) => m.id === memberId);
      if (member) {
        const attachmentPromises = attachments?.map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64Content = e.target.result.split(",")[1];
              resolve({ filename: file.name, content: base64Content });
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
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

        const response = await sendNewsletter(emailContent);
        if (response) {
          const { data, error } = response;

          if (data) {
            toast.success("Email(s) sent successfully.", {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            });
          } else if (error) {
            toast.error(error.message || "An error occurred. Pls try again.");
          }
        }
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

  const displayedMembers = filteredMembers.slice(0, 5);

  const handleSelectAllMembers = () => {
    setSelectedMembers(members.map((member) => member.id));
  };

  const handleDeselectAllMembers = () => {
    setSelectedMembers([]);
  };

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className="top-10 text-gray-100 hover:cursor-pointer">
        <a
          onClick={() => window.history.back()}
          className=" flex items-center gap-2 hover:opacity-80"
        >
          <ArrowLeftIcon className="h-5 w-5" /> Back
        </a>
      </div>
      <div className="px-4 font-sans text-light md:px-36 lg:px-64">
        <h1 className="mb-4 text-2xl font-bold text-light">Newsletter Creation</h1>

        <div className="my-5">
          <input
            id="senderName"
            type="text"
            placeholder="Organization Name"
            value={senderName}
            disabled
            hidden
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
          <input
            id="searchMembers"
            type="text"
            placeholder="To"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            onFocus={handleInputFocus}
            className="my-2 w-full rounded-lg border-none bg-[#525252] p-2 text-white"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {selectedMembers?.map((memberId) => {
                const member = members.find((m) => m.id === memberId);
                return (
                  <span
                    key={memberId}
                    className="mr-2 flex h-8 items-center rounded-full bg-primary px-3 py-1 text-white"
                  >
                    {member.name}
                    <button
                      onClick={() => handleMemberSelect(memberId)}
                      className="hover:bg-primaryw ml-2 rounded-full bg-transparent text-white"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            {isInputFocused && (
              <div className="flex flex-wrap gap-2">
                {filteredMembers?.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleMemberSelect(member.id)}
                    className="flex h-8 items-center rounded-full bg-charleston px-3 py-1 text-white"
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="my-2 flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAllMembers}
              className="rounded-md border-none bg-primary px-2 text-white hover:bg-primarydark"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAllMembers}
              className="hover:bg-charlestondark rounded-md border-none bg-charleston px-2 text-white"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div>
          <input
            id="subject"
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={handleSubjectChange}
            className="w-full rounded-lg border-none bg-[#525252] p-2 text-white"
          />
        </div>

        <div className="my-5">
          <ReactQuill
            id="editor"
            theme="snow"
            placeholder="Compose your newsletter..."
            value={editorState}
            onChange={onEditorStateChange}
            className="bg-light text-black"
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
            className="w-full rounded-lg border-none bg-[#525252] p-2 text-white"
          />
        </div>

        <div className="my-12 flex items-center justify-between">
          <button
            onClick={handleSendNewsletter}
            className="cursor-pointer rounded border-none bg-primary px-4 py-2 text-white"
          >
            Send Newsletter
          </button>
        </div>
      </div>
    </>
  );
}
