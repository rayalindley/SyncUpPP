"use server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function insertPost(formData: any, organizationid: string) {
  const supabase = createClient();
  try {
    const userData = await getUser(); // Get the current user's data

    if (!userData) {
      console.error("Failed to retrieve user data: User not authenticated");
      throw new Error("User not authenticated");
    }

    const authorid = userData.user?.id; // Extract the user ID from userData

    console.log("Retrieved authorid:", authorid); // Log the retrieved authorid

    const insertValues = {
      content: formData.content,
      createdat: new Date().toISOString(), // Using the current date/time
      organizationid: organizationid,
      authorid: authorid, // Use the fetched user ID
      privacylevel: formData.privacyLevel,
      postphoto: formData.postphoto,
    };

    const { data, error } = await supabase.from("posts").insert([insertValues]).select();

    if (!error) {
      return { data, error: null };
    } else {
      console.error("Error inserting post:", error.message); // Log any insertion errors
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

export async function fetchPosts(
  organizationid: string,
  currentPage: number,
  postsPerPage: number
) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("organizationid", organizationid)
      .range(currentPage * postsPerPage - postsPerPage, currentPage * postsPerPage)
      .order("createdat", { ascending: false });

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

export async function updatePost(updatedPost: { postid: string; content: string }) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("posts")
      .update({ content: updatedPost.content })
      .eq("postid", updatedPost.postid)
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


export async function getAuthorFirstName(authorid: string) {
  const supabase = createClient();
  try {
    // Assuming you have a view named 'combined_user_data' where user information is stored
    const { data, error } = await supabase.from("combined_user_data").select("first_name").eq("id", authorid).single();
    
    if (error) {
      console.error("Error fetching author's first name:", error.message);
      return null;
    }

    return data?.first_name || null;
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return null;
  }
}
