"use server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import {
  EmailContent,
  AdminUuid,
  User,
  OrganizationUuid,
  EventUuid,
  CreateEmailResponse,
  Organization,
} from "./types";

export async function fetchSentEmailsByAdmin(adminUserId: AdminUuid) {
  const supabase = createClient();
  try {
    const { data: sentEmails, error } = await supabase.rpc("get_emails_by_admin", {
      admin_user_id: adminUserId,
    });

    if (error) throw error;
    return sentEmails;
  } catch (error) {
    console.error("Error fetching sent emails:", error);
    return [];
  }
}


export async function sendEmail(emailContent: EmailContent) {
  const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);
  try {
    const response = await resend.emails.send(emailContent);
    console.log("Email sent:", response);
    return response;
  } catch (error) {
    console.error("Error sending newsletter.");
    throw error; // Re-throw error to handle it in the calling function
  }
}

export async function sendNewsletter(
  subject: string,
  content: string,
  allUsers: User[],
  attachments: any[],
  from: string
) {
  const supabase = createClient();
  let successCount = 0;
  let failures: { email: string; reason: string }[] = [];

  const uniqueUsers = allUsers.filter(
    (user, index, self) => index === self.findIndex((t) => t.email === user.email)
  );

  const promises = uniqueUsers.map(async (user) => {
    if (user && user.email) {
      const emailContent: EmailContent = {
        from: `${from} <onboarding@resend.dev>`,
        to: user.email,
        subject,
        html: content,
        attachments,
      };

      try {
        const emailResponse = await sendEmail(emailContent);
        if (emailResponse) {
          const insertResponse = await supabase.from("emails").insert([
            {
              sender: from,
              receiver: user.email,
              subject,
              body: content,
              status: "Sent",
            },
          ]);

          if (insertResponse.data == null) {
            console.error("API Key Error");
            throw new Error(insertResponse.error?.message || "API Key Error");
          }

          successCount++;
          return emailResponse;
        }
      } catch (emailError: any) {
        failures.push({ email: user.email, reason: emailError?.message });
        console.error("Error sending email:", emailError);
      }
    }
  });

  const responses = await Promise.all(promises);
  return { successCount, failures, responses };
}


export async function fetchMembersByOrganization(organizationUuid: OrganizationUuid) {
  const supabase = createClient();
  try {
    const { data: members, error }: { data: any; error: any } = await supabase.rpc(
      "get_all_combined_user_data_by_org",
      { organization_uuid: organizationUuid }
    );

    if (error) throw error;

    return members;
  } catch (error: any) {
    console.error("Error fetching members by organization:", error.message);
    return [];
  }
}

export async function fetchMembersByEvent(eventUuid: EventUuid) {
  const supabase = createClient();
  try {
    const { data: members, error }: { data: any; error: any } = await supabase.rpc(
      "get_all_combined_user_data_by_event",
      { event_uuid: eventUuid }
    );

    if (error) throw error;

    return members;
  } catch (error: any) {
    console.error("Error fetching members by event:", error.message);
    return [];
  }
}

// New function to fetch events by organization
export async function fetchEventsByOrganization(organizationUuid: OrganizationUuid) {
  const supabase = createClient();
  try {
    const { data: events, error }: { data: any; error: any } = await supabase.rpc(
      "get_events_by_organization",
      { org_id: organizationUuid }
    );

    if (error) throw error;

    return events;
  } catch (error: any) {
    console.error("Error fetching events by organization:", error.message);
    return [];
  }
}

export async function fetchOrganizationBySlug(
  slug: string
): Promise<Organization | null> {
  const supabase = createClient();
  try {
    const { data: organization, error } = await supabase.rpc("get_organization_by_slug", {
      org_slug: slug,
    });

    if (error) throw error;

    return organization.length > 0 ? organization[0] : null;
  } catch (error) {
    console.error("Error fetching organization by slug:", error);
    return null;
  }
}
