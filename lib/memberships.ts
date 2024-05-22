"use server";
import { createClient } from "@/lib/supabase/server";


export async function getMemberships(id:any) {
    const supabase = createClient();
    let { data: memberships, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('organizationid', id)
  
    if (error) {
      console.error('Failed to fetch memberships:', error.message);
      return []; 
    }
  
    return memberships || []; 
  }
  
  export async function getOrgMem(id:any) {
    const supabase = createClient();
    let { data: org_memberships, error } = await supabase
    .from('organization_memberships')
    .select('*')
            
    .eq('organizationid', id)
  
    if (error) {
      console.error('Failed to fetch memberships:', error.message);
      return []; 
    }
  
    return org_memberships || []; 
  }
  

export async function deleteMembership(id: any) {
  const supabase = createClient();

  try {
    const { error } = await supabase
    .from('memberships')
    .delete()
    .eq("membershipid", id)
        

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

export async function getMembers(id:any) {
  const supabase = createClient();
  let { data: org_members, error } = await supabase
  .from('user_membership_info')
  .select('*')
          
  .eq('membershipid', id)

  if (error) {
    console.error('Failed to fetch members:', error.message);
    return []; 
  }

  return org_members || []; 
}

export async function fetchMembershipById(membershipId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("membershipid", membershipId)
      .single(); // Use .single() to return only one record

    if (!error && data) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error?.message || "Event not found" } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function insertMembership(formData: any, organizationId: string) {
  const insertValues = {
    name: formData.name,
    description: formData.description,
    registrationfee: formData.registrationfee,
    organizationid: organizationId,
    features: formData.features,
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('memberships')
      .insert([insertValues])
      .select();

    if (error) {
      return { data: null, error: { message: error.message } };
    }
    return { data, error: null };
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return { data: null, error: { message: e.message || 'An unexpected error occurred' } };
  }
}

export async function updateMembership(membershipId: string, formData: any) {
  const updateValues = {
    name: formData.name,
    description: formData.description,
    registrationfee: formData.registrationfee,
    features: formData.features,
  };

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('memberships')
      .update(updateValues)
      .eq('membershipid', membershipId)
      .select();

    if (error) {
      return { data: null, error: { message: error.message } };
    }
    return { data, error: null };
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return { data: null, error: { message: e.message || 'An unexpected error occurred' } };
  }
}