"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function insertOrganization<OrganizationFormValues>(formData: any) {
  const insertValues = {
    name: formData.name,
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
