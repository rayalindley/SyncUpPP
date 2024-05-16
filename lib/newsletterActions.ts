// lib/newsletterActions.js
"use server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from 'resend';

// Function to send a newsletter
export async function sendEmail(emailContent) {
  const resend = new Resend();
  console.log(emailContent)
  try {
    const response = await resend.emails.send({
      from: emailContent.from,
      to: emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments: emailContent.attachments,
    });

    if (response.error) throw response.error;

    return {
      success: true,
      data: response.data, // Assuming the API returns a success message or email ID
    };
  } catch (error) {
    console.error("Error sending newsletter:", error.message);
    return {
      success: false,
      message: error.message || "Failed to send newsletter",
    };
  }
}

// Function to fetch sent emails
export async function fetchSentEmails() {
  const supabase = createClient();
  try {
    const { data: sentEmails, error } = await supabase
      .from("emails")
      .select("*"); // Select only required fields

    if (error) throw error;

    return sentEmails;
  } catch (error) {
    console.error("Error fetching sent emails:", error.message);
    return [];
  }
}

export async function sendNewsletter(subject, content, allUsers, attachments, from) {
  allUsers.map(async (user) => {

    if (user && user.email) {
      const emailContent = {
        from: `${from} <onboarding@resend.dev>`,
        to: user.email,
        subject: subject,
        html: content,
        attachments: attachments, // Assuming attachments are handled elsewhere
      };

      const resppnse = await sendEmail(emailContent);
    }
  });
}
/////////////////////////////////////
////////////////////////////////////
// Function to fetch all members managed by the current admin
export async function fetchMembersByAdmin(adminUuid) {
  // //console.log('Fetching members by admin:', adminUuid);
  const supabase = createClient();
  try {
    const { data: members, error } = await supabase.rpc("get_all_combined_user_data_by_admin", { admin_uuid: adminUuid });

    if (error) throw error;

    //console.log('Fetched members:', members);
    return members.map((member) => ({
      ...member,
      name: `${member.first_name} ${member.last_name}`,
    }));
  } catch (error) {
    console.error("Error fetching members by admin:", error.message);
    return [];
  }
}

// Function to fetch all organizations managed by the current admin
export async function fetchOrganizationsByAdmin(adminUuid) {
  //console.log('Fetching organizations by admin:', adminUuid);
  const supabase = createClient();
  try {
    const { data: organizations, error } = await supabase.rpc("get_all_organizations_by_admin", { admin_uuid: adminUuid });

    if (error) throw error;

    //console.log('Fetched organizations:', organizations);
    return organizations;
  } catch (error) {
    console.error("Error fetching organizations by admin:", error.message);
    return [];
  }
}

// Function to fetch all members of a specific organization
export async function fetchMembersByOrganization(organizationUuid) {
  //console.log('Fetching members by organization:', organizationUuid);
  const supabase = createClient();
  try {
    const { data: members, error } = await supabase.rpc("get_all_combined_user_data_by_org", { organization_uuid: organizationUuid });

    if (error) throw error;

    //console.log('Fetched members:', members);
    return members;
  } catch (error) {
    console.error("Error fetching members by organization:", error.message);
    return [];
  }
}

// Function to fetch all events managed by the current admin
export async function fetchEventsByAdmin(adminUuid) {
  //console.log('Fetching events by admin:', adminUuid);
  const supabase = createClient();
  try {
    const { data: events, error } = await supabase.rpc("get_all_events_by_admin", { admin_uuid: adminUuid });

    if (error) throw error;

    //console.log('Fetched events:', events);
    return events;
  } catch (error) {
    console.error("Error fetching events by admin:", error.message);
    return [];
  }
}

// Function to fetch all members registered for a specific event
export async function fetchMembersByEvent(eventUuid) {
  //console.log('Fetching members by event:', eventUuid);
  const supabase = createClient();
  try {
    const { data: members, error } = await supabase.rpc("get_all_combined_user_data_by_event", { event_uuid: eventUuid });

    if (error) throw error;

    //console.log('Fetched members:', members);
    return members;
  } catch (error) {
    console.error("Error fetching members by event:", error.message);
    return [];
  }
}