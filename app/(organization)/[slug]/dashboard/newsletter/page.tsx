"use client";

import { useUser } from "@/context/user_context";
import { fetchEventsByOrganization, fetchMembersByEvent, fetchMembersByOrganization, fetchOrganizationBySlug, fetchSentEmailsByAdmin, sendNewsletter } from "@/lib/newsletter_actions";
import { CombinedUserData } from "@/types/combined_user_data";
import { Email } from "@/types/email";
import { Event } from "@/types/event";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
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
  const orgSlug = params?.slug;

  const [editorState, setEditorState] = useState("");
  const [subject, setSubject] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<CombinedUserData[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (user && orgSlug) {
        const organization = await fetchOrganizationBySlug(orgSlug as string);
        if (organization) {
          const eventsData = await fetchEventsByOrganization(organization.organizationid);
          const usersData = await fetchMembersByOrganization(organization.organizationid);
          const emailsData = await fetchSentEmailsByAdmin(user.id || "");
          setEvents(eventsData);
          setUsers(usersData);
          setSentEmails(emailsData);
        }
      }
    }
    fetchData();
  }, [user, orgSlug]);

  const handleSendNewsletter = async () => {
    setSending(true);
    // Additional logic for sending the newsletter
    setSending(false);
  };

  const eventColumns = [
    { name: "Title", selector: (row: Event) => row.title, sortable: true },
    { name: "Location", selector: (row: Event) => row.location, sortable: true },
    { name: "Start Date", selector: (row: Event) => new Date(row.starteventdatetime).toLocaleString(), sortable: true },
    { name: "End Date", selector: (row: Event) => new Date(row.endeventdatetime).toLocaleString(), sortable: true },
  ];

  const userColumns = [
    { name: "Email", selector: (row: CombinedUserData) => row.email || "", sortable: true },
    { name: "First Name", selector: (row: CombinedUserData) => row.first_name || "", sortable: true },
    { name: "Last Name", selector: (row: CombinedUserData) => row.last_name || "", sortable: true },
  ];

  const emailColumns = [
    { name: "Subject", selector: (row: Email) => row.subject, sortable: true },
    { name: "Receiver", selector: (row: Email) => row.receiver, sortable: true },
    { name: "Status", selector: (row: Email) => row.status, sortable: true },
    { name: "Date Sent", selector: (row: Email) => new Date(row.date_created).toLocaleString(), sortable: true },
  ];

  // Custom styles for dark mode
  const customStyles = {
    header: {
      style: {
        backgroundColor: "#1f1f1f",
        color: "#ffffff",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#333333",
        color: "#ffffff",
      },
    },
    headCells: {
      style: {
        color: "#ffffff",
      },
    },
    rows: {
      style: {
        backgroundColor: "#2a2a2a",
        color: "#ffffff",
        '&:hover': {
          backgroundColor: "#3e3e3e",
        },
      },
    },
    pagination: {
      style: {
        backgroundColor: "#1f1f1f",
        color: "#ffffff",
      },
    },
    noData: {
      style: {
        backgroundColor: "#1f1f1f",
        color: "#ffffff",
      },
    },
  };

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={5000} theme="dark" />
      <div className="bg-raisin mb-40 max-w-full space-y-6 rounded-lg p-10 font-sans text-white">
        <h1 className="text-3xl border-b-2 border-primary pb-4">Newsletter Creation</h1>

        <input
          className="w-full rounded border bg-charleston p-4 text-base focus:border-primary"
          type="text"
          placeholder="Subject*"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <ReactQuill theme="snow" value={editorState} onChange={setEditorState} className="rounded border border-primary p-2 text-white" />

        <h2 className="text-2xl border-b-2 border-primary pb-4">Select Recipients</h2>

        <details>
          <summary className="cursor-pointer text-lg">Events</summary>
          <DataTable
            columns={eventColumns}
            data={events}
            selectableRows
            pagination
            customStyles={customStyles}
            noDataComponent={<div>There are no records to display</div>} // Using a <div> to avoid type issues
          />
        </details>

        <details>
          <summary className="cursor-pointer text-lg">Individual Users</summary>
          <DataTable
            columns={userColumns}
            data={users}
            selectableRows
            pagination
            customStyles={customStyles}
            noDataComponent={<div>There are no records to display</div>} // Using a <div> to avoid type issues
          />
        </details>

        <button onClick={handleSendNewsletter} className="mt-6 cursor-pointer rounded bg-primary px-6 py-3 text-lg text-white" disabled={sending}>
          {sending ? "Sending..." : "Send Newsletter"}
        </button>

        <h2 className="text-2xl border-b-2 border-primary pb-4">Sent Emails</h2>
        <DataTable
          columns={emailColumns}
          data={sentEmails}
          pagination
          customStyles={customStyles}
          noDataComponent={<div>There are no records to display</div>} // Using a <div> to avoid type issues
        />
      </div>
    </>
  );
}
