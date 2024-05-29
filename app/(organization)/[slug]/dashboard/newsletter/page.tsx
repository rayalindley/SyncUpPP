"use client";

import CombinedUserDataTable from "@/components/CombinedUserDataTable";
import EmailsTable from "@/components/EmailsTable";
import EventsTable from "@/components/EventsTable";
import Preloader from "@/components/preloader";
import { useUser } from "@/context/UserContext";
import {
  fetchEventsByOrganization,
  fetchMembersByEvent,
  fetchMembersByOrganization,
  fetchOrganizationBySlug,
  fetchSentEmailsByAdmin,
  sendNewsletter,
} from "@/lib/newsletterActions";
import { check_permissions } from "@/lib/organization";
import { createClient } from "@/lib/supabase/client";
import { CombinedUserData, Email, Event } from "@/lib/types";
import { getCombinedUserDataById } from "@/lib/userActions";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import "react-quill/dist/quill.snow.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const newsletterSchema = z.object({
  subject: z
    .string()
    .nonempty({ message: "Subject field is required" })
    .max(100, { message: "Subject cannot exceed 100 characters" }),
  content: z
    .string()
    .refine(
      (val) =>
        val.replace(/<(.|\n)*?>/g, "").trim().length >= 10 &&
        val.replace(/<(.|\n)*?>/g, "").length <= 1000,
      {
        message:
          "Content must be between 10 and 1000 characters long (excluding HTML tags)",
      }
    ),
});

export default function NewsletterPage() {
  const { user } = useUser();
  const params = useParams();
  const orgSlug = params?.slug; // Make sure to use the correct parameter name

  const [editorState, setEditorState] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectLength, setSubjectLength] = useState(0);
  const [contentLength, setContentLength] = useState(0);
  const [attachments, setAttachments] = useState<
    Array<{ filename: string; content: string | ArrayBuffer | null }>
  >([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<CombinedUserData[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [sending, setSending] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .channel("emails")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emails" },
        async (payload) => {
          if (user) {
            const emailsData = await fetchSentEmailsByAdmin(user.id || "");
            // Sort emails by date_created in descending order before setting the state
            const sortedEmails = sortEmails(emailsData, "date_created", "desc");
            setSentEmails(sortedEmails);
          }
        }
      )
      .subscribe();
  }, [user]);

  useEffect(() => {
    async function fetchData() {
      if (user && orgSlug) {
        const organization = await fetchOrganizationBySlug(orgSlug as string);
        if (organization) {
          const eventsData = await fetchEventsByOrganization(organization.organizationid);
          const usersData = await fetchMembersByOrganization(organization.organizationid);
          const emailsData = await fetchSentEmailsByAdmin(user.id || "");

          const eventsWithSelected = eventsData.map((event: Event) => ({
            ...event,
            id: event.eventid,
            selected: false,
          }));
          const usersWithSelected = usersData.map((user: CombinedUserData) => ({
            ...user,
            selected: false,
          }));

          // Sort emails by date_created in descending order before setting the state
          const sortedEmails = sortEmails(emailsData, "date_created", "desc");
          setEvents(eventsWithSelected);
          setUsers(usersWithSelected);
          setSentEmails(sortedEmails);
        }
      }
    }

    async function checkPermission() {
      if (user && orgSlug) {
        const organization = await fetchOrganizationBySlug(orgSlug as string);
        if (organization) {
          const hasPermission = await check_permissions(
            user.id || "",
            organization.organizationid,
            "send_newsletters"
          );
          setHasPermission(hasPermission);
        }
      }
    }

    fetchData();
    checkPermission();
  }, [user, orgSlug]);

  const transformUserData = (userDataArray: Array<{ data: CombinedUserData }>) => {
    return userDataArray.map(({ data }) => ({
      id: data.id,
      email: data.email,
      role: data.role,
      created_at: data.created_at,
      updated_at: data.updated_at,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender,
      dateofbirth: data.dateofbirth,
      description: data.description,
      company: data.company,
      website: data.website,
      updatedat: data.updatedat,
    }));
  };

  const handleSendNewsletter = async () => {
    setSending(true);
    const selectedEventIds = events
      .filter((event) => event.selected)
      .map((event) => event.eventid);
    const selectedUserIds = users.filter((user) => user.selected).map((user) => user.id);

    const eventMembers = await Promise.all(
      selectedEventIds.map((eventId) => fetchMembersByEvent(eventId))
    );

    const selectedUsers = await Promise.all(
      selectedUserIds.map((userId) => getCombinedUserDataById(userId || ""))
    );

    const transformedUsers = transformUserData(selectedUsers);

    const allUsers = [...new Set([...eventMembers.flat(), ...transformedUsers])].map(
      (item) => item
    );

    if (subject.trim()) {
      setFormErrors((prevErrors) => ({ ...prevErrors, subject: "" }));
    }

    if (editorState.trim()) {
      setFormErrors((prevErrors) => ({ ...prevErrors, content: "" }));
    }

    try {
      newsletterSchema.parse({
        subject: subject,
        content: editorState,
      });
      if (allUsers.length === 0) {
        setSending(false);
        toast.error(
          "Please select at least one recipient. The event you selected may not have any members."
        );
        return;
      }

      const organization = await fetchOrganizationBySlug(orgSlug as string); // Ensure organization is fetched here

      const sendNewsletterPromise = sendNewsletter(
        subject,
        editorState,
        allUsers,
        attachments,
        organization?.name || "",
        organization?.organizationid || ""
      );

      // console.log("subject", subject, "\ncontent", editorState, "\nallUsers", allUsers, "\nattachments", attachments, "\norganization", organization?.name || "")

      const { successCount, failures } = await sendNewsletterPromise;

      if (successCount > 0) {
        toast.success(`Newsletter sent successfully to ${successCount} recipients!`);

        if (user) {
          const emailsData = await fetchSentEmailsByAdmin(user.id || "");
          // Sort emails by date_created in descending order before setting the state
          const sortedEmails = sortEmails(emailsData, "date_created", "desc");
          setSentEmails(sortedEmails);
        }
      }

      if (failures.length > 0) {
        let errorCount = 0;
        let otherFailuresCount = 0;

        failures.forEach((failure) => {
          if (errorCount < 2) {
            toast.error(`Failed to send to ${failure.email}: ${failure.reason}`);
            errorCount++;
          } else {
            otherFailuresCount++;
          }
        });

        if (otherFailuresCount > 0) {
          toast.error(
            `${otherFailuresCount} other emails failed to send due to similar errors.`
          );
        }
      }

      setSending(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        const transformedErrors: Record<string, string> = {};

        Object.keys(fieldErrors).forEach((key) => {
          if (fieldErrors[key] !== undefined) {
            transformedErrors[key] = fieldErrors[key]!.join(", ");
          } else {
            transformedErrors[key] = "No error message provided.";
          }
        });

        setFormErrors(transformedErrors);
        setSending(false);
        toast.error("Please fill in all required fields");
      }
    }
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    let totalSize = files.reduce((total, file) => total + file.size, 0);

    if (totalSize > 600 * 1024) {
      setFileError("Total size of attachments should not exceed 600KB");
      return;
    }

    setSelectedFiles(files);
    setFileError("");
  };

  const handleSubjectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSubject(value);
    setSubjectLength(value.length);
    setFormErrors((prevErrors) => ({ ...prevErrors, subject: "" }));
  };

  const onEditorStateChange = (value: string) => {
    if (value.length <= 1007) {
      setEditorState(value);
      setContentLength(value.replace(/<(.|\n)*?>/g, "").length);
    }
    setFormErrors((prevErrors) => ({ ...prevErrors, content: "" }));
  };

  const toggleSelection = (
    list: Array<{ id: string; selected: boolean }>,
    id: string
  ) => {
    return list.map((item) => ({
      ...item,
      selected: item.id === id ? !item.selected : item.selected,
    }));
  };

  const toggleEventSelection = (list: Event[], id: string): Event[] => {
    return list.map((item) => ({
      ...item,
      selected: item.id === id ? !item.selected : item.selected,
    }));
  };

  const toggleCombinedUserSelection = (
    list: CombinedUserData[],
    id: string
  ): CombinedUserData[] => {
    return list.map((item) => ({
      ...item,
      selected: item.id === id ? !item.selected : item.selected,
    }));
  };

  if (hasPermission === null) {
    return <Preloader />;
  }

  if (!hasPermission) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Newsletter Creation</h1>
          <p className="text-lg">
            You do not have permission to create newsletters for this organization.
          </p>
        </div>
      </div>
    );
  }

  if (!orgSlug) {
    return (
      <div className="bg-raisin flex min-h-screen items-center justify-center p-10 font-sans text-white">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Newsletter Creation</h1>
          <p className="text-lg">Please select an organization to create a newsletter.</p>
        </div>
      </div>
    );
  }

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
      <div
        ref={scrollRef}
        className="bg-raisin mb-40 max-w-full space-y-6 rounded-lg p-10 font-sans text-white"
      >
        <h1 className="border-b-2 border-primary pb-4 text-3xl">Newsletter Creation</h1>
        <div className="space-y-4">
          <div className="relative w-full">
            <input
              className="w-full rounded border bg-charleston p-4 text-base focus:border-primary"
              type="text"
              placeholder="Subject*"
              value={subject}
              onChange={handleSubjectChange}
              maxLength={100}
              style={{ paddingRight: "50px" }} // reserve space for the character count
            />
            <p className="absolute bottom-1 right-3 text-sm text-gray-400">
              {subjectLength}/100
            </p>
          </div>
          {formErrors.subject && (
            <p className="text-sm text-red-500">{formErrors.subject}</p>
          )}
        </div>
        <div className="relative space-y-4 text-white">
          <ReactQuill
            theme="snow"
            value={editorState}
            onChange={onEditorStateChange}
            className="rounded border border-primary p-2 text-white"
          />
          <p className="absolute bottom-3 right-5 text-sm text-gray-400">
            {contentLength}/1000
          </p>
        </div>
        {formErrors.content && (
          <p className="text-sm text-red-500">{formErrors.content}</p>
        )}
        <div className="space-y-4">
          <label htmlFor="attachments" className="mb-2 block text-lg">
            Attachments:
          </label>
          <label
            htmlFor="attachments"
            className="mt-2 block cursor-pointer rounded bg-primary px-4 py-2 text-white"
          >
            Select attachments
            <input
              type="file"
              multiple
              id="attachments"
              onChange={handleAttachmentChange}
              className="hidden"
            />
          </label>

          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>
                {file.name} ({Math.round(file.size / 1024)} KB)
              </li>
            ))}
          </ul>

          {fileError && <p className="text-sm text-red-500">{fileError}</p>}
        </div>

        <div className="h-12"></div>
        <h2 className="border-b-2 border-primary pb-4 text-2xl">Select Recipients</h2>
        <div className="space-y-4 rounded-lg bg-[#2a2a2a] p-6">
          <details className="mb-4">
            <summary className="cursor-pointer text-lg">
              <strong>Events</strong> (Select an event to send emails to all its
              registrants)
            </summary>
            <div className="overflow-x-auto rounded-lg bg-[#2a2a2a] p-6">
              <EventsTable
                events={events}
                setEvents={setEvents}
                toggleSelection={toggleEventSelection}
              />
            </div>
          </details>
          <hr className="my-6" />
          <details className="mb-4">
            <summary className="cursor-pointer text-lg">
              <strong>Individual Users</strong> (Select specific users to send them
              emails)
            </summary>
            <div className="overflow-x-auto rounded-lg bg-[#2a2a2a] p-6">
              <CombinedUserDataTable
                users={users}
                setUsers={setUsers}
                toggleSelection={toggleCombinedUserSelection}
              />
            </div>
          </details>
        </div>

        <button
          onClick={handleSendNewsletter}
          className="mt-6 cursor-pointer rounded bg-primary px-6 py-3 text-lg text-white"
          disabled={sending}
        >
          {sending ? "Sending..." : "Send Newsletter"}
        </button>
        <div className="h-24"></div>
        <h2 className="border-b-2 border-primary pb-4 text-2xl">Sent Emails</h2>
        <div className="overflow-x-auto rounded-lg bg-[#2a2a2a] p-6">
          <EmailsTable emails={sentEmails} setEmails={setSentEmails} />
        </div>
      </div>
    </>
  );
}

// Utility function to sort emails
const sortEmails = (emails: Email[], column: string, direction: string) => {
  return emails.sort((a, b) => {
    if (a[column] === null) return 1;
    if (b[column] === null) return -1;
    if (a[column] === b[column]) return 0;
    return direction === "asc"
      ? a[column] > b[column]
        ? 1
        : -1
      : a[column] < b[column]
        ? 1
        : -1;
  });
};
