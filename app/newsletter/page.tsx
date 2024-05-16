// NewsletterPage.js
"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/context/UserContext";
import { useTable, useSortBy } from 'react-table';
import {
  fetchMembersByAdmin,
  fetchOrganizationsByAdmin,
  fetchEventsByAdmin,
  fetchMembersByOrganization,
  fetchMembersByEvent,
  sendNewsletter,
  fetchSentEmails,
} from "@/lib/newsletterActions";
// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

export default function NewsletterPage() {
  const { user } = useUser();
  const [editorState, setEditorState] = useState("");
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedFromOrgName, setSelectedFromOrgName] = useState(null);
  const [sentEmails, setSentEmails] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        const orgsData = await fetchOrganizationsByAdmin(user.id);
        const eventsData = await fetchEventsByAdmin(user.id);
        const usersData = await fetchMembersByAdmin(user.id);

        // Add 'selected' property to each organization, event, and user
        const orgsWithSelected = orgsData.map((org) => ({
          ...org,
          id: org.organizationid,
          selected: false,
        }));
        const eventsWithSelected = eventsData.map((event) => ({
          ...event,
          id: event.eventid,
          selected: false,
        }));
        const usersWithSelected = usersData.map((user) => ({ ...user, selected: false }));

        setOrgs(orgsWithSelected);
        setEvents(eventsWithSelected);
        setUsers(usersWithSelected);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    async function fetchEmails() {
      const emails = await fetchSentEmails();
      setSentEmails(emails);
    }
    fetchEmails();
  }, []);

  const handleSendNewsletter = async () => {
    const selectedOrgIds = orgs
      .filter((org) => org.selected)
      .map((org) => org.organizationid);
    const selectedEventIds = events
      .filter((event) => event.selected)
      .map((event) => event.eventid);
    const selectedUserIds = users.filter((user) => user.selected).map((user) => user.id);

    // Fetch members for each selected organization
    const orgMembers = await Promise.all(
      selectedOrgIds.map((orgId) => fetchMembersByOrganization(orgId))
    );

    // Fetch members for each selected event
    const eventMembers = await Promise.all(
      selectedEventIds.map((eventId) => fetchMembersByEvent(eventId))
    );

    // Flatten and deduplicate the user IDs
    const allUsers = [
      ...new Set([...orgMembers.flat(), ...eventMembers.flat(), ...selectedUserIds]),
    ];

    console.log("Sending newsletter to from", selectedFromOrgName, allUsers);

    // Send the newsletter
    if (selectedFromOrgName) {
      // Send the newsletter
      await sendNewsletter(
        subject,
        editorState,
        allUsers,
        attachments,
        selectedFromOrgName
      );
    } else {
      console.error("No 'from' organization selected.");
    }
  };

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files);
    const readers = [];

    // Create a FileReader for each file and read it as a base64 string
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        readers.push({
          filename: file.name,
          content: reader.result, // This is now a base64 string
        });
        // Check if all files have been read
        if (readers.length === files.length) {
          setAttachments(readers);
        }
      };
      reader.onerror = (error) => console.error("Error reading file:", error);
      reader.readAsDataURL(file); // Read the file as Data URL (base64)
    });
  };

  const handleSubjectChange = (event) => {
    setSubject(event.target.value);
  };

  const onEditorStateChange = (value) => {
    setEditorState(value);
  };

  const toggleSelection = (list, id) => {
    return list.map((item) => ({
      ...item,
      selected: item.id === id ? !item.selected : item.selected,
    }));
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useSortBy);
  return (
    <div>
      <h1>Newsletter Creation</h1>
      <div>
        <label htmlFor="fromOrg">From Organization:</label>
        <select
          id="fromOrg"
          value={selectedFromOrgName}
          onChange={(e) => setSelectedFromOrgName(e.target.value)}
        >
          <option value="">Select an organization</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.name}>
              {org.name}
            </option>
          ))}
        </select>
      </div>
  
      <div>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={handleSubjectChange}
        />
      </div>
      <div>
        <ReactQuill
          theme="snow"
          placeholder="Compose your newsletter..."
          value={editorState}
          onChange={onEditorStateChange}
        />
      </div>
      <div>
        <label htmlFor="attachments">Attachments:</label>
        <input type="file" multiple onChange={handleAttachmentChange} />
      </div>
  
      <h2>Select Recipients</h2>
      <div>
        <h3>Organizations</h3>
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Organization Name</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={org.selected || false}
                    onChange={() => setOrgs(toggleSelection(orgs, org.id))}
                  />
                </td>
                <td>{org.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3>Events</h3>
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Event Name</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={event.selected || false}
                    onChange={() => setEvents(toggleSelection(events, event.id))}
                  />
                </td>
                <td>{event.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3>Users</h3>
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>User Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={user.selected || false}
                    onChange={() => setUsers(toggleSelection(users, user.id))}
                  />
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={handleSendNewsletter}>Send Newsletter</button>
  
      <h2>Sent Emails</h2>
      <table>
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Status</th>
            <th>Date Sent</th>
          </tr>
        </thead>
        <tbody>
          {sentEmails.map((email) => (
            <tr key={email.id}>
              <td>{email.receiver}</td>
              <td>{email.status}</td>
              <td>{email.date_created}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
          }  