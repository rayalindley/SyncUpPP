// lib/newsletterActions.js
"use server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function fetchMembers(slug) {
  const supabase = createClient();
  try {
    // First, get the organization ID based on the slug
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("organizationid")
      .eq("slug", slug)
      .single();

    if (orgError) throw orgError;

    // Then, get the member IDs from the organizationmembers table
    const { data: memberIDs, error: memberIDsError } = await supabase
      .from("organizationmembers")
      .select("userid")
      .eq("organizationid", organization.organizationid);

    if (memberIDsError) throw memberIDsError;

    // Fetch user profiles for each member ID
    const memberProfiles = [];
    for (const member of memberIDs) {
      const { data: userProfile, error: userProfileError } = await supabase
        .from("combined_user_data")
        .select("*") // Select only required fields
        .eq("id", member.userid)
        .single();

      if (userProfileError) throw userProfileError;

      // Construct the full name
      const fullName = `${userProfile.first_name} ${userProfile.last_name}`;
      memberProfiles.push({ ...userProfile, name: fullName });
    }

    return memberProfiles;
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

export async function getOrganizationNameBySlug(slug: string) {
  const supabase = createClient();
  try {
    let { data, error } = await supabase
      .from('organizations')
      .select('name')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error:', error);
      return { name: null, error: { message: error.message } };
    } else {
      return { name: data.name, error: null };
    }
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return {
      name: null,
      error: { message: e.message || 'An unexpected error occurred' },
    };
  }
}

export async function sendNewsletter(emailContent) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(emailContent);

  if (error) {
    return console.error({ error });
  }
  
  return { data };

  // console.log("sendnewsletter", { data });
}
