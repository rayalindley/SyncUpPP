"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/context/UserContext";
import { CombinedUserData, Email, Event, Organization } from "@/lib/types";
import {
  fetchMembersByAdmin,
  fetchOrganizationsByAdmin,
  fetchEventsByAdmin,
  fetchMembersByOrganization,
  fetchMembersByEvent,
  sendNewsletter,
  fetchSentEmailsByAdmin,
} from "@/lib/newsletterActions";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import { z } from "zod";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCombinedUserDataById } from "@/lib/userActions";
import EmailsTable from "@/components/EmailsTable";
import { createClient } from "@/lib/supabase/client";
import OrganizationsTable from "@/components/OrganizationTable";
import EventsTable from "@/components/EventsTable";
import CombinedUserDataTable from "@/components/CombinedUserDataTable";

const newsletterSchema = z.object({
  from: z
    .string()
    .nullable()
    .refine((val) => val !== null && val !== "", {
      message: "From field is required",
    }),
  subject: z.string().nonempty({ message: "Subject field is required" }),
  content: z.string().nonempty({ message: "Content field is required" }),
});

export default function NewsletterPage() {
  const { user } = useUser();
  const [editorState, setEditorState] = useState("");
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<
    Array<{ filename: string; content: string | ArrayBuffer | null }>
  >([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<CombinedUserData[]>([]);
  const [selectedFromOrgName, setSelectedFromOrgName] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (sending) {
      timeoutId = setTimeout(() => {
        toast.error(
          "Sending the newsletter is taking longer than expected. Please check your internet connection."
        );
        setSending(false);
      }, 30000);
    } else {
      clearTimeout(timeoutId!);
    }
    return () => clearTimeout(timeoutId!);
  }, [sending]);

  useEffect(() => {
    const supabase = createClient();
    const channels = supabase
      .channel("emails")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emails" },
        async (payload) => {
          if (user) {
            const emailsData = await fetchSentEmailsByAdmin(user.id);
            setSentEmails(emailsData);
          }
        }
      )
      .subscribe();
  }, [user]);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        const organizationsData = await fetchOrganizationsByAdmin(user.id);
        const eventsData = await fetchEventsByAdmin(user.id);
        const usersData = await fetchMembersByAdmin(user.id);
        const emailsData = await fetchSentEmailsByAdmin(user.id);

        const organizationsWithSelected = organizationsData.map((org: Organization) => ({
          ...org,
          id: org.organizationid,
          selected: false,
        }));
        const eventsWithSelected = eventsData.map((event: Event) => ({
          ...event,
          id: event.eventid,
          selected: false,
        }));
        const usersWithSelected = usersData.map((user: CombinedUserData) => ({
          ...user,
          selected: false,
        }));

        setOrganizations(organizationsWithSelected);
        setEvents(eventsWithSelected);
        setUsers(usersWithSelected);
        setSentEmails(emailsData);
      }
    }
    fetchData();
  }, [user]);

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
    const selectedOrgIds = organizations
      .filter((org) => org.selected)
      .map((org) => org.organizationid);
    const selectedEventIds = events
      .filter((event) => event.selected)
      .map((event) => event.eventid);
    const selectedUserIds = users.filter((user) => user.selected).map((user) => user.id);

    const orgMembers = await Promise.all(
      selectedOrgIds.map((orgId) => fetchMembersByOrganization(orgId))
    );

    const eventMembers = await Promise.all(
      selectedEventIds.map((eventId) => fetchMembersByEvent(eventId))
    );

    const selectedUsers = await Promise.all(
      selectedUserIds.map((userId) => getCombinedUserDataById(userId || ""))
    );

    const transformedUsers = transformUserData(selectedUsers);

    const allUsers = [
      ...new Set([...orgMembers.flat(), ...eventMembers.flat(), ...transformedUsers]),
    ].map((item) => item);

    if (selectedFromOrgName) {
      setFormErrors((prevErrors) => ({ ...prevErrors, from: "" }));
    }

    if (subject.trim()) {
      setFormErrors((prevErrors) => ({ ...prevErrors, subject: "" }));
    }

    if (editorState.trim()) {
      setFormErrors((prevErrors) => ({ ...prevErrors, content: "" }));
    }

    try {
      newsletterSchema.parse({
        from: selectedFromOrgName,
        subject: subject,
        content: editorState,
      });
      if (allUsers.length === 0) {
        setSending(false);
        toast.error(
          "Please select at least one recipient. The event or organization you selected may not have any members."
        );
        return;
      }

      const sendNewsletterPromise = sendNewsletter(
        subject,
        editorState,
        allUsers,
        attachments,
        selectedFromOrgName ?? ""
      );

      const { successCount, failures } = await sendNewsletterPromise;

      if (successCount > 0) {
        toast.success(`Newsletter sent successfully to ${successCount} recipients!`);

        if (user) {
          const emailsData = await fetchSentEmailsByAdmin(user.id);
          setSentEmails(emailsData);
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
        // Transform the fieldErrors to match the expected type for setFormErrors
        const fieldErrors = error.flatten().fieldErrors;
        const transformedErrors: Record<string, string> = {};

        Object.keys(fieldErrors).forEach((key) => {
          // Check if fieldErrors[key] is not undefined before calling join
          if (fieldErrors[key] !== undefined) {
            // Since we've checked for undefined, we don't need the optional chaining operator
            transformedErrors[key] = fieldErrors[key]!.join(", ");
          } else {
            // Handle the case where fieldErrors[key] is undefined
            transformedErrors[key] = "No error message provided.";
          }
        });

        setFormErrors(transformedErrors);
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
    setSubject(event.target.value);
  };

  const onEditorStateChange = (value: string) => {
    setEditorState(value);
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

  const toggleOrganizationSelection = (
    list: Organization[],
    id: string
  ): Organization[] => {
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
      <div className="bg-raisin mb-40 max-w-full space-y-6 rounded-lg p-10 font-sans text-white">
        <h1 className="border-b-2 border-primary pb-4 text-3xl">Newsletter Creation</h1>
        <div className="space-y-4">
          <select
            className="w-full rounded border border-primary bg-charleston p-4 text-base"
            id="fromOrg"
            value={selectedFromOrgName || ""}
            onChange={(e) => setSelectedFromOrgName(e.target.value)}
            title="Select a sender organization"
          >
            <option value="">Select a sender organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.name}>
                {org.name}
              </option>
            ))}
          </select>
          {formErrors.from && <p className="text-sm text-red-500">{formErrors.from}</p>}
        </div>

        <div className="space-y-4">
          <input
            className="w-full rounded border border-primary bg-charleston p-4 text-base"
            type="text"
            placeholder="Subject*"
            value={subject}
            onChange={handleSubjectChange}
          />
          {formErrors.subject && (
            <p className="text-sm text-red-500">{formErrors.subject}</p>
          )}
        </div>
        <div className="space-y-4 bg-light text-black">
          <ReactQuill
            theme="snow"
            placeholder="Newsletter Body*"
            value={editorState}
            onChange={onEditorStateChange}
            className="rounded border border-primary p-2"
          />
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
              <strong>Organizations</strong> (Select an organization to send emails to all
              its members)
            </summary>
            <div className="overflow-x-auto rounded-lg bg-[#2a2a2a] p-6">
              <OrganizationsTable
                organizations={organizations}
                setOrganizations={setOrganizations}
                toggleSelection={toggleOrganizationSelection}
              />
            </div>
          </details>
          <hr className="my-6" />
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
