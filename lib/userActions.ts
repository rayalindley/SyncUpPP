"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { UserProfile } from "./types";

export async function sendPasswordRecovery(email: string) {
  const supabase = createClient();
  try {
    let { data, error } = await supabase.auth.resetPasswordForEmail(email);

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

export async function deleteUser(id: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(id);

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

// a function to get combined user data by id
export async function getCombinedUserDataById(userId: string) {
  console.log("Creating Supabase client...");
  const supabase = createClient();

  console.log("Starting try block...");
  try {
    console.log("Attempting to get combined user data...");
    const { data, error } = await supabase
      .from('combined_user_data')
      .select("*")
      .eq('id', userId);

    console.log("Get operation completed. Checking for errors...");
    if (!error) {
      console.log("No errors detected. Data:", data);
      return { data, error: null };
    } else {
      console.log("Error detected:", error.message);
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

// a function to get userprofile by id
export async function getUserProfileById(userId: string) {
  console.log("Creating Supabase client...");
  const supabase = createClient();

  console.log("Starting try block...");
  try {
    console.log("Attempting to get user profile...");
    const { data, error } = await supabase
      .from('userprofiles')
      .select("*")
      .eq('userid', userId);

    console.log("Get operation completed. Checking for errors...");
    if (!error) {
      console.log("No errors detected. Data:", data);
      return { data, error: null };
    } else {
      console.log("Error detected:", error.message);
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

// a function to edit userprofile by id
export async function updateUserProfileById(userId: string, updatedData: UserProfile) {
  console.log("Creating Supabase client...");
  const supabase = createClient();

  console.log("Starting try block...");
  try {
    console.log("Attempting to update user profile...");
    const { data, error } = await supabase
      .from('userprofiles')
      .update(updatedData)
      .eq('userid', userId)
      .select('*');

    console.log("Update operation completed. Checking for errors...");
    if (!error) {
      console.log("No errors detected. Data:", data);
      return { data, error: null };
    } else {
      console.log("Error detected:", error.message);
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