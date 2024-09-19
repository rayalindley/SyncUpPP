"use client";

import { useUser } from "@/context/user_context";
import {
  fetchEventsByOrganization,
  fetchMembersByOrganization,
  fetchMembersByEvent,
  fetchOrganizationBySlug,
  fetchSentEmailsByAdmin,
  sendNewsletter,
} from "@/lib/newsletter_actions";
import { CombinedUserData } from "@/types/combined_user_data";
import { Email } from "@/types/email";
import { Event } from "@/types/event";
import { useParams } from "next/navigation";
import React, { useEffect, useState, Fragment } from "react";
import DataTable from "react-data-table-component";
import dynamic from "next/dynamic"; // Dynamic import for client-side only
import { Disclosure, Dialog, Transition } from "@headlessui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import parse from "html-react-parser";
import { z } from "zod"; // Importing Zod for validation

// Dynamically import RichTextEditor from "@mantine/rte"
const RichTextEditor = dynamic(() => import("@mantine/rte"), { ssr: false });

// Define Zod schema for validation
const newsletterSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  recipients: z.array(z.object({ email: z.string().email() })).min(1, "At least one recipient is required"),
});

export default function NewsletterPage() {
  const { user } = useUser();
  const params = useParams();
  const orgSlug = params?.slug;

  const [editorState, setEditorState] = useState("");
  const [subject, setSubject] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<CombinedUserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<CombinedUserData[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [sending, setSending] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // State to control the preview modal

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (user && orgSlug) {
        console.log("Fetching organization with slug:", orgSlug);
        const organization = await fetchOrganizationBySlug(orgSlug as string);
        console.log("Organization data:", organization);

        if (organization) {
          console.log("Fetching events for organization:", organization.organizationid);
          const eventsData = await fetchEventsByOrganization(organization.organizationid);
          console.log("Fetched events:", eventsData);

          console.log("Fetching users for organization:", organization.organizationid);
          const usersData = await fetchMembersByOrganization(organization.organizationid);
          console.log("Fetched users:", usersData);

          console.log("Fetching sent emails by admin:", user.id);
          const emailsData = await fetchSentEmailsByAdmin(user.id || "");
          console.log("Fetched sent emails:", emailsData);

          setEvents(eventsData);
          setUsers(usersData);
          setSentEmails(emailsData);
        }
      }
    }
    fetchData();
  }, [user, orgSlug]);

  const validateForm = () => {
    try {
      const combinedUsers = [...selectedUsers, ...selectedEvents.flatMap(event => event.users || [])]; // Combine users and event users
      const uniqueUsers = combinedUsers.filter(
        (user, index, self) => index === self.findIndex((t) => t.email === user.email)
      );
      const formData = {
        subject,
        content: editorState,
        recipients: uniqueUsers,
      };

      // Validate using Zod schema
      newsletterSchema.parse(formData);

      setValidationErrors(null); // Clear any validation errors
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationErrors(err.errors.map(e => e.message).join(", "));
      }
      return false;
    }
  };

  const handleSendNewsletter = async () => {
    if (!validateForm()) return; // Stop submission if validation fails

    setSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      if (user && orgSlug) {
        console.log("Fetching organization details for sending newsletter...");
        const organization = await fetchOrganizationBySlug(orgSlug as string);
        console.log("Organization data fetched:", organization);

        if (organization) {
          // Fetch members from selected events
          let selectedEventUsers: CombinedUserData[] = [];
          for (const event of selectedEvents) {
            console.log("Fetching users for event:", event.eventid);
            const eventUsers = await fetchMembersByEvent(event.eventid);
            selectedEventUsers = [...selectedEventUsers, ...eventUsers];
          }

          // Combine selected users and event users
          const combinedUsers = [...selectedUsers, ...selectedEventUsers];

          // Remove duplicate users by email
          const uniqueUsers = combinedUsers.filter(
            (user, index, self) => index === self.findIndex((t) => t.email === user.email)
          );

          console.log("Unique users to send to:", uniqueUsers);
          const organizationName = organization.name;
          const organizationUuid = organization.organizationid;

          console.log("Sending newsletter with the following details:");
          console.log("Subject:", subject);
          console.log("Content:", editorState);
          console.log("All Users:", uniqueUsers);
          console.log("Organization Name:", organizationName);
          console.log("Organization UUID:", organizationUuid);

          // Send the newsletter and get results
          const result = await sendNewsletter(
            subject,
            editorState,
            uniqueUsers,
            [], // Assuming no attachments for now
            organizationName,
            organizationUuid
          );

          // Display success/failure messages
          if (result.failures.length > 0) {
            setErrorMessage(`Failed to send some emails. Details: ${result.failures.map(f => f.email + ": " + f.reason).join(", ")}`);
          } else {
            setSuccessMessage("Newsletter sent successfully!");
          }
        }
      }
    } catch (error) {
      console.error("Failed to send newsletter:", error);
      setErrorMessage("Failed to send newsletter.");
    } finally {
      setSending(false);
    }
  };

  // Open the email preview modal
  const openEmailPreview = (email: Email) => {
    setSelectedEmail(email);
    setIsPreviewOpen(true);
  };

  const eventColumns = [
    { name: "Title", selector: (row: Event) => row.title, sortable: true },
    { name: "Location", selector: (row: Event) => row.location, sortable: true },
    {
      name: "Start Date",
      selector: (row: Event) => new Date(row.starteventdatetime).toLocaleString(),
      sortable: true,
    },
    {
      name: "End Date",
      selector: (row: Event) => new Date(row.endeventdatetime).toLocaleString(),
      sortable: true,
    },
  ];

  const userColumns = [
    {
      name: "Email",
      selector: (row: CombinedUserData) => row.email || "",
      sortable: true,
    },
    {
      name: "First Name",
      selector: (row: CombinedUserData) => row.first_name || "",
      sortable: true,
    },
    {
      name: "Last Name",
      selector: (row: CombinedUserData) => row.last_name || "",
      sortable: true,
    },
  ];

  const emailColumns = [
    { name: "Subject", selector: (row: Email) => row.subject, sortable: true },
    { name: "Receiver", selector: (row: Email) => row.receiver, sortable: true },
    { name: "Status", selector: (row: Email) => row.status, sortable: true },
    {
      name: "Date Sent",
      selector: (row: Email) => new Date(row.date_created).toLocaleString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: Email) => (
        <button className="text-primary underline" onClick={() => openEmailPreview(row)}>
          Preview
        </button>
      ),
    },
  ];

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
        "&:hover": {
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
      <div className="bg-raisin mb-40 max-w-full space-y-6 rounded-lg p-10 font-sans text-white">
        <h1 className="border-b-2 border-primary pb-4 text-3xl">Newsletter Creation</h1>

        <input
          className="w-full rounded border bg-charleston p-4 text-base focus:border-primary"
          type="text"
          placeholder="Subject*"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <RichTextEditor
          value={editorState}
          onChange={setEditorState}
          className="rounded border border-primary p-2 text-white"
          styles={{
            root: {
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
            },
            toolbar: {
              backgroundColor: "#333333",
              borderColor: "#444444",
            },
          }}
        />

        {/* Validation Error Messages */}
        {validationErrors && (
          <div className="mt-4 rounded bg-red-100 p-4 text-red-500">{validationErrors}</div>
        )}

        <h2 className="border-b-2 border-primary pb-4 text-2xl">Select Recipients</h2>

        {/* Event Registrants Section */}
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between rounded-lg bg-[#333333] px-4 py-2 text-left text-lg font-medium text-white focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                <span>Events</span>
                {open ? (
                  <ChevronUpIcon className="h-5 w-5 text-white" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-white" />
                )}
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-200">
                <DataTable
                  columns={eventColumns}
                  data={events}
                  selectableRows
                  onSelectedRowsChange={(selectedRows) => {
                    setSelectedEvents(selectedRows.selectedRows);
                  }}
                  pagination
                  customStyles={customStyles}
                  noDataComponent={<div>There are no records to display</div>}
                />
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* Individual Users Section */}
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="mt-4 flex w-full justify-between rounded-lg bg-[#333333] px-4 py-2 text-left text-lg font-medium text-white focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                <span>Individual Users</span>
                {open ? (
                  <ChevronUpIcon className="h-5 w-5 text-white" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-white" />
                )}
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-200">
                <DataTable
                  columns={userColumns}
                  data={users}
                  selectableRows
                  onSelectedRowsChange={(selectedRows) => {
                    setSelectedUsers(selectedRows.selectedRows);
                  }}
                  pagination
                  customStyles={customStyles}
                  noDataComponent={<div>There are no records to display</div>}
                />
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <button
          onClick={handleSendNewsletter}
          className="mt-6 cursor-pointer rounded bg-primary px-6 py-3 text-lg text-white"
          disabled={sending}
        >
          {sending ? "Sending..." : "Send Newsletter"}
        </button>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mt-4 rounded bg-green-100 p-4 text-green-500">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 rounded bg-red-100 p-4 text-red-500">{errorMessage}</div>
        )}

        <h2 className="border-b-2 border-primary pb-4 text-2xl">Sent Emails</h2>
        <DataTable
          columns={emailColumns}
          data={sentEmails}
          pagination
          customStyles={customStyles}
          noDataComponent={<div>There are no records to display</div>}
        />
      </div>

      {/* Preview Modal */}
      {selectedEmail && (
        <Transition appear show={isPreviewOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={() => setIsPreviewOpen(false)}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-75" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  {/* Dark mode styling with custom background color */}
                  <Dialog.Panel
                    className="w-full max-w-3xl transform overflow-hidden rounded-lg p-6 text-left align-middle shadow-xl transition-all"
                    style={{ backgroundColor: "#333333" }}
                  >
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-white"
                    >
                      Preview Email: {selectedEmail.subject}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-400">
                        Sent to: {selectedEmail.receiver}
                      </p>
                      {/* Dark mode content area */}
                      <div className="prose prose-invert mt-4 max-w-full text-white">
                        {parse(selectedEmail.body)}
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        className="hover:bg-primary-dark focus-visible:ring-primary-light inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring focus-visible:ring-opacity-75"
                        onClick={() => setIsPreviewOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
}
