"use server";
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
export async function getCombinedUserDataById(
  userId: string
): Promise<{ data: any | null; error: any | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc("get_combined_user_data_by_id", {
      user_id: userId,
    });
    if (!error && data) {
      return { data: data[0], error: null }; // Assuming the data returned is an array and we need the first object.
    } else {
      return { data: null, error: error || { message: "No data found" } };
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
export async function getUserProfileById(
  userId: string
): Promise<{ data: UserProfile | null; error: any | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_user_profile_by_id", {
      user_id: userId,
    });

    if (!error && data) {
      return { data: data[0], error: null }; // Assuming the data returned is an array and we need the first object.
    } else {
      return { data: null, error: error || { message: "No data found" } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export async function updateUserProfileById(
  userId: string,
  updatedData: UserProfile
): Promise<{ data: UserProfile | null; error: any | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("update_user_profile_by_id", {
      user_id: userId,
      updated_data: updatedData,
    });

    if (!error && data) {
      console.log("User profile updated successfully");
      return { data: data[0], error: null }; // Assuming the data returned is an array and we need the first object.
    } else {
      console.error("Error updating user profile:", error);
      return {
        data: null,
        error: error || { message: "An error occurred while updating the user profile" },
      };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

// a function to get user email by id
export async function getUserEmailById(
  userId: string
): Promise<{ data: { email: string } | null; error: any | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_user_email_by_id", {
      user_id: userId,
    });

    if (!error && data) {
      return { data: data[0], error: null }; // Assuming the data returned is an array and we need the first object.
    } else {
      return { data: null, error: error || { message: "No data found" } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

// a function to get user by id
export async function getUserById(userId: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single(); // Use .single() to return only one record

    if (!error && data) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error?.message || "User not found" } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}
