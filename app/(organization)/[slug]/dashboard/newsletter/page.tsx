"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { z } from "zod";
import "react-quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";
import { getCombinedUserDataById } from "@/lib/userActions";
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
import { EmailModel } from "@/models/emailModel";
import { EventModel } from "@/models/eventModel";
import { CombinedUserDataModel } from "@/models/combinedUserDataModel";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const newsletterSchema = z.object({
  subject: z.string().nonempty().max(100),
  content: z.string().min(10).max(1000),
});

export default function NewsletterPage() {
  const { user } = useUser();
  const { slug: orgSlug } = useParams() as { slug: string };
  const [editorState, setEditorState] = useState("");
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [events, setEvents] = useState<EventModel[]>([]);
  const [users, setUsers] = useState<CombinedUserDataModel[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailModel[]>([]);
  const [sending, setSending] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchInitialData = async () => {
      if (user && orgSlug) {
        const organization = await fetchOrganizationBySlug(orgSlug);
        if (!organization) return;

        const organizationId = organization.organizationid;
        if (!organizationId) return;

        setHasPermission(await check_permissions(user.id!, organizationId, "send_newsletters"));
        
        if (await check_permissions(user.id!, organizationId, "send_newsletters")) {
          const fetchedEvents = await fetchEventsByOrganization(organizationId);
          console.log("Fetched Events:", fetchedEvents);
          setEvents(fetchedEvents);

          const fetchedUsers = await fetchMembersByOrganization(organizationId);
          console.log("Fetched Users:", fetchedUsers);
          setUsers(fetchedUsers);

          supabase.channel("emails")
            .on("postgres_changes", { event: "*", schema: "public", table: "emails" }, async () => {
              if (user && user.id) {
                setSentEmails(await fetchSentEmailsByAdmin(user.id));
              }
            })
            .subscribe();
        } else {
          setHasPermission(false);
        }
      } else {
        setHasPermission(false);
      }
    };
    fetchInitialData();
  }, [user, orgSlug]);

  const handleSendNewsletter = async () => {
    setSending(true);
    try {
      newsletterSchema.parse({ subject, content: editorState });
      const selectedEventIds = events.filter(e => e.getSelected()).map(e => e.getEventId());
      const selectedUserIds = users.filter(u => u.getSelected()).map(u => u.getId());

      const allUsers = [
        ...new Set([
          ...selectedEventIds.flatMap(eventId => fetchMembersByEvent(eventId)),
          ...selectedUserIds.map(userId => getCombinedUserDataById(userId)),
        ]),
      ];

      if (!allUsers.length) throw new Error("No recipients selected");

      const organization = await fetchOrganizationBySlug(orgSlug);
      if (!organization) throw new Error("Organization not found");

      const { successCount, failures } = await sendNewsletter(
        subject,
        editorState,
        await Promise.all(allUsers),
        attachments,
        organization.name,
        organization.organizationid
      );

      if (successCount) toast.success(`Newsletter sent to ${successCount} recipients!`);
      if (failures.length) toast.error(`Failed to send to some recipients.`);
      setSending(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Please fill in all required fields");
      setSending(false);
    }
  };

  if (hasPermission === null) return <div className="text-white text-center">Loading...</div>;
  if (!hasPermission) return <div className="text-white text-center">You do not have permission to create newsletters for this organization.</div>;
  if (!orgSlug) return <div className="text-white text-center">Please select an organization to create a newsletter.</div>;

  const eventColumns: GridColDef[] = [
    { field: "eventid", headerName: "Event ID", width: 100 },
    { field: "title", headerName: "Event Name", width: 200 },
    { 
      field: "eventdatetime", 
      headerName: "Date and Time", 
      width: 180,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString();
        }
        return "N/A"; // Handle null or undefined values
      }
    },
    { field: "location", headerName: "Location", width: 150 },
    { field: "registrationfee", headerName: "Fee", width: 100,
      valueFormatter: (params: any) => `$${Number(params.value).toFixed(2)}` },
    { field: "capacity", headerName: "Capacity", width: 100 },
    { field: "tags", headerName: "Tags", width: 150 },
    { field: "privacy", headerName: "Privacy", width: 100 },
    { field: "description", headerName: "Description", width: 300 },
    { field: "organizationid", headerName: "Organization ID", width: 150 },
    { field: "createdat", headerName: "Created At", width: 180,
      valueFormatter: (params: any) => new Date(params.value).toLocaleString() },
    { field: "updatedat", headerName: "Updated At", width: 180,
      valueFormatter: (params: any) => new Date(params.value).toLocaleString() },
  ];

  const userColumns: GridColDef[] = [
    { field: "id", headerName: "User ID", width: 250 },
    { field: "email", headerName: "Email Address", width: 200 },
    { field: "role", headerName: "Role", width: 120 },
    { 
      field: "created_at", 
      headerName: "Created At", 
      width: 180,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString();
        }
        return "N/A"; // Handle null or undefined values
      }
    },
    { 
      field: "updated_at", 
      headerName: "Updated At", 
      width: 180,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString();
        }
        return "N/A"; // Handle null or undefined values
      }
    },
    { field: "first_name", headerName: "First Name", width: 120 },
    { field: "last_name", headerName: "Last Name", width: 120 },
    { field: "gender", headerName: "Gender", width: 100 },
    { 
      field: "dateofbirth", 
      headerName: "Date of Birth", 
      width: 120,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString();
        }
        return "N/A"; // Handle null or undefined values
      }
    },
    { field: "description", headerName: "Description", width: 300 },
    { field: "company", headerName: "Company", width: 150 },
    { field: "website", headerName: "Website", width: 200 },
    { 
      field: "updatedat", 
      headerName: "Updated At", 
      width: 180,
      valueFormatter: (params: any) => {
        if (params.value) {
          return new Date(params.value).toLocaleString();
        }
        return "N/A"; // Handle null or undefined values
      }
    },
  ];

  const sentEmailColumns: GridColDef[] = [
    { field: "subject", headerName: "Subject", width: 200 },
    { field: "sent_at", headerName: "Sent At", width: 180,
      valueFormatter: (params: any) => new Date(params.value).toLocaleString() },
    { field: "recipient_count", headerName: "Recipients", width: 120 },
    // Add any other relevant fields for sent emails
  ];

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={5000} theme="dark" />
      <div className="bg-gray-900 text-white p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center border-b border-gray-700 pb-4">Newsletter Creation</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={100}
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded"
          />
          <label htmlFor="editor" className="sr-only">Newsletter Content</label>
          <ReactQuill id="editor" theme="snow" value={editorState} onChange={setEditorState} className="bg-gray-800 border border-gray-700 rounded" />
          <label htmlFor="attachments" className="sr-only">Attachments</label>
          <input
            id="attachments"
            type="file"
            multiple
            onChange={(e) => setAttachments(e.target.files ? Array.from(e.target.files) : [] )}
            className="w-full p-4 bg-gray-800 border border-gray-700 rounded"
          />
        </div>
        <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2">Select Recipients</h2>
        <div className="space-y-6">
          <details className="bg-gray-800 rounded p-4">
            <summary className="text-lg font-medium">Events</summary>
            <div className="mt-4">
              <DataGrid
                rows={events}
                columns={eventColumns}
                checkboxSelection
                autoHeight
                getRowId={(row) => row.eventid}
                className="bg-gray-800 text-white"
                columnBufferPx={2}
              />
            </div>
          </details>
          <details className="bg-gray-800 rounded p-4">
            <summary className="text-lg font-medium">Individual Users</summary>
            <div className="mt-4">
              <DataGrid
                rows={users}
                columns={userColumns}
                checkboxSelection
                autoHeight
                getRowId={(row) => row.id}
                className="bg-gray-800 text-white"
                columnBufferPx={2}
              />
            </div>
          </details>
        </div>
        <button
          onClick={handleSendNewsletter}
          disabled={sending}
          className="w-full p-4 bg-blue-600 rounded text-lg font-semibold hover:bg-blue-500"
        >
          {sending ? "Sending..." : "Send Newsletter"}
        </button>
        <h2 className="text-2xl font-semibold border-b border-gray-700 pb-2">Sent Emails</h2>
        <div className="bg-gray-800 rounded p-4">
          <DataGrid
            rows={sentEmails}
            columns={sentEmailColumns}
            autoHeight
            getRowId={(row) => row.id}
            className="bg-gray-800 text-white"
            columnBufferPx={2}
          />
        </div>
      </div>
    </>
  );
}

