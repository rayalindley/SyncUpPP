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
