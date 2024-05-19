"use server";
import { createClient } from "@/lib/supabase/server";

// TODO: Add permissions, check whether the user has permissions to do it or not.

export async function insertOrganization(formData: any) {
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
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("organizations")
      .insert([insertValues])
      .select();

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
      .single(); // Use .single() to ensure that only one record is returned

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
