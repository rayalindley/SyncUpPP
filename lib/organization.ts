"use server";
import { createClient } from "@/lib/supabase/server";

// TODO: Add permissions, check whether the user has permissions to do it or not.

export async function createOrganization(formData: any) {
  const insertValues = {
    name: formData.name,
    photo: formData.photo,
    banner: formData.banner,
    slug: formData.slug,
    description: formData.description,
    organization_type: formData.organizationType,
    industry: formData.industry,
    organization_size: formData.organizationSize,
    website: formData.website,
    date_established: formData.dateEstablished,
    address: {
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      stateProvince: formData.stateProvince,
      country: formData.country,
    },
    socials: {
      facebook: formData.facebookLink,
      twitter: formData.twitterLink,
      linkedin: formData.linkedinLink,
    },
    organization_access: formData.organizationAccess,
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("organizations")
      .insert([insertValues])
      .select().single();

    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function updateOrganization(organizationid: string, formData: any) {
  const updateValues = {
    name: formData.name,
    photo: formData.photo,
    banner: formData.banner,
    slug: formData.slug,
    description: formData.description,
    organization_type: formData.organizationType,
    industry: formData.industry,
    organization_size: formData.organizationSize,
    website: formData.website,
    date_established: formData.dateEstablished,
    address: {
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      stateProvince: formData.stateProvince,
      country: formData.country,
    },
    socials: {
      facebook: formData.facebookLink,
      twitter: formData.twitterLink,
      linkedin: formData.linkedinLink,
    },
    organization_access: formData.organizationAccess,
  };

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("organizations")
      .update(updateValues)
      .eq("organizationid", organizationid)
      .select("*")
      .single();

    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function fetchOrganizationBySlug(slug: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .single(); // Use .single() to ensure that only one record is returned'

    if (error) {
      console.error("Error fetching organization:", error);
      return { data: null, error: { message: error.message } };
    } else {
      return { data, error: null };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function deleteOrganization(id: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("organizationid", id);

    if (!error) {
      return { error: null };
    } else {
      return { error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function fetchOrganizationsForUser(userId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("adminid", userId); // Assuming 'user_id' is the field that relates organizations to users

    if (!error) {
      return { data, error: null };
    } else {
      console.error("Error fetching organizations for user:", error);
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function fetchOrganizationsForUserWithViewPermission(userId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("user_organization_dashboard_view")
      .select("*")
      .eq("user_id", userId)

    if (!error) {
      return { data, error: null };
    } else {
      console.error("Error fetching organizations for user:", error);
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function getUserOrganizationInfo(userId: string, organizationid: string) {
  const supabase = createClient();
  // console.log("orgaiztion.ts userId", userId);
  // console.log("orgaiztion.ts organizationid", organizationid);

  const { data, error } = await supabase
    .rpc("get_user_organization_info", {
      user_id: userId,
      organization_id: organizationid,
    })
    .single();

  if (error) {
    console.error("Error calling RPC function:", error);
    return null;
  }

  return data;
}

export async function check_permissions(
  userid: string,
  org_id: string,
  perm_key: string
) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("check_org_permissions", {
    p_user_id: userid,
    p_org_id: org_id,
    p_perm_key: perm_key,
  });

  if (error) {
    console.error("Error checking permissions", error);
    return null;
  }

  return data;
}

// fetch all orgs
export async function fetchAllOrganizations() {
  const supabase = createClient();

  const { data, error } = await supabase.from("organizations").select("*");

  if (error) {
    console.error("Error fetching organizations:", error);
    return null;
  }

  return data;
}

export async function fetchOrganizationsJoinedByUser(userId: string) {
  const supabase = createClient();

  try {
    const { data: memberships, error: membershipsError } = await supabase
      .from("organizationmembers") // Changed to organizationmembers table
      .select("organizationid") // Selecting organizationid from organizationmembers
      .eq("userid", userId); // Filtering by userid

    if (membershipsError) {
      console.error("Error fetching organizations joined by user:", membershipsError);
      return { data: null, error: { message: membershipsError.message } };
    }

    // Extract organization IDs from memberships
    const organizationIds = memberships.map((membership: any) => membership.organizationid);

    // If no organization IDs are found, return an empty array
    if (organizationIds.length === 0) {
      return { data: [], error: null };
    }

    // Fetch organization details from the organizations table for the joined organizations
    const { data: organizations, error: organizationsError } = await supabase
      .from("organization_summary") // Assuming the table name is organizations
      .select("*, total_members, total_posts, total_events") // Include total_members, total_posts, total_events
      .in("organizationid", organizationIds);

    if (organizationsError) {
      console.error("Error fetching organization details:", organizationsError);
      return { data: null, error: { message: organizationsError.message } };
    }

    // Return the organizations directly without additional formatting
    return { data: organizations, error: null };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}
