"use server";
import { createClient } from "@/lib/supabase/server";

export async function getMemberships(id: string) {
  // console.log("memberships.ts: getMemberships called with id:", id);
  const supabase = createClient();

  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("organizationid", id)
    .order("registrationfee", { ascending: true }); // Order by registrationfee in ascending order

  if (error) {
    console.error("memberships.ts: Failed to fetch memberships:", error.message);
    return [];
  }

  // console.log("memberships.ts: Fetched memberships:", memberships);
  return memberships || [];
}

export async function getOrgMem(id: any) {
  // console.log("memberships.ts: getOrgMem called with id:", id);
  const supabase = createClient();
  let { data: org_memberships, error } = await supabase
    .from("organization_memberships")
    .select("*")
    .eq("organizationid", id);

  if (error) {
    console.error("memberships.ts: Failed to fetch organization memberships:", error.message);
    return [];
  }

  // console.log("memberships.ts: Fetched organization memberships:", org_memberships);
  return org_memberships || [];
}

export async function deleteMembership(id: any) {
  // console.log("memberships.ts: deleteMembership called with id:", id);
  const supabase = createClient();

  try {
    const { error } = await supabase.from("memberships").delete().eq("membershipid", id);

    if (!error) {
      // console.log("memberships.ts: Deleted membership with id:", id);
      return { error: null };
    } else {
      console.error("memberships.ts: Error deleting membership:", error.message);
      return { error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("memberships.ts: Unexpected error:", e);
    return {
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function getMembers(id: any) {
  // console.log("memberships.ts: getMembers called with id:", id);
  const supabase = createClient();
  let { data: org_members, error } = await supabase
    .from("user_membership_info")
    .select("*")
    .eq("membershipid", id);

  if (error) {
    console.error("memberships.ts: Failed to fetch members:", error.message);
    return [];
  }

  // console.log("memberships.ts: Fetched members:", org_members);
  return org_members || [];
}

export async function fetchMembershipById(membershipId: string) {
  // console.log("memberships.ts: fetchMembershipById called with membershipId:", membershipId);
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("membershipid", membershipId)
      .single();

    if (!error && data) {
      // console.log("memberships.ts: Fetched membership by id:", data);
      return { data, error: null };
    } else {
      console.error("memberships.ts: Error fetching membership by id:", error?.message);
      return { data: null, error: { message: error?.message || "Event not found" } };
    }
  } catch (e: any) {
    console.error("memberships.ts: Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function insertMembership(formData: any, organizationid: string) {
  // console.log("memberships.ts: insertMembership called with formData:", formData, "and organizationid:", organizationid);
  const insertValues = {
    name: formData.name,
    description: formData.description,
    registrationfee: formData.registrationfee,
    organizationid: organizationid,
    features: formData.features,
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("memberships")
      .insert([insertValues])
      .select();

    if (error) {
      console.error("memberships.ts: Error inserting membership:", error.message);
      return { data: null, error: { message: error.message } };
    }

    // console.log("memberships.ts: Inserted membership:", data);
    return { data, error: null };
  } catch (e: any) {
    console.error("memberships.ts: Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function updateMembership(membershipId: string, formData: any) {
  // console.log("memberships.ts: updateMembership called with membershipId:", membershipId, "and formData:", formData);
  const updateValues = {
    name: formData.name,
    description: formData.description,
    registrationfee: formData.registrationfee,
    features: formData.features,
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("memberships")
      .update(updateValues)
      .eq("membershipid", membershipId)
      .select();

    if (error) {
      console.error("memberships.ts: Error updating membership:", error.message);
      return { data: null, error: { message: error.message } };
    }

    // console.log("memberships.ts: Updated membership:", data);
    return { data, error: null };
  } catch (e: any) {
    console.error("memberships.ts: Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function fetchOrgMemBySlug(slug: string | string[]) {
  // console.log("memberships.ts: fetchOrgMemBySlug called with slug:", slug);
  const supabase = createClient();
  let { data: org_memberships, error } = await supabase
    .from("organization_memberships")
    .select("*")
    .eq("slug", slug)
    .order("registrationfee", { ascending: true }); // Order by registrationfee in ascending order

  if (error) {
    console.error("memberships.ts: Failed to fetch organization memberships by slug:", error.message);
    return [];
  }

  // console.log("memberships.ts: Fetched organization memberships by slug:", org_memberships);
  return org_memberships;
}

export async function fetchMembersBySlug(slug: string) {
  // console.log("memberships.ts: fetchMembersBySlug called with slug:", slug);
  const supabase = createClient();
  try {
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("organizationid")
      .eq("slug", slug)
      .single();

    if (orgError) {
      console.error("memberships.ts: Failed to fetch organization:", orgError.message);
      return [];
    }

    if (!org) {
      console.error("memberships.ts: Organization not found with slug:", slug);
      return [];
    }

    const { data: members, error: memberError } = await supabase
      .from("user_membership_info")
      .select("*")
      .eq("organizationid", org.organizationid);

    if (memberError) {
      console.error("memberships.ts: Failed to fetch members:", memberError.message);
      return [];
    }

    // console.log("memberships.ts: Fetched members by slug:", members);
    return members || [];
  } catch (e: any) {
    console.error("memberships.ts: Unexpected error:", e);
    return [];
  }
}

export async function getUserMembership(orgId: string, userId: string) {
  // console.log("memberships.ts: getUserMembership called with orgId:", orgId, "and userId:", userId);
  const supabase = createClient();

  const { data, error } = await supabase
    .from("organizationmembers")
    .select("membershipid")
    .eq("organizationid", orgId)
    .eq("userid", userId)
    .single();

  if (error) {
    console.error("memberships.ts: Error fetching user's membership:", error.message);
    return null;
  }

  // console.log("memberships.ts: Fetched user's membership:", data);
  return data?.membershipid || null;
}

export async function fetchOrganizationMembersBySlug(slug: string) {
    const supabase = createClient();

  
  const { data, error } = await supabase
    .from('organization_members_view')
    .select('*')
    .eq('organization_slug', slug);

  if (error) {
    console.error('Error fetching organization members:', error);
    return null;
  }

  return data;
}
