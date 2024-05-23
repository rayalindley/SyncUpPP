"use server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function insertPost(formData: any, organizationid: string) {
  const supabase = createClient();

  try {
    const insertValues = {
      content: formData.content,
      organizationid: organizationid,
      privacylevel: formData.privacyLevel,
      postphotos: formData.postphotos || [], // Ensure this is an array
    };

    const { data, error } = await supabase.from("posts").insert([insertValues]).select().single();

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

export async function fetchPosts(organizationid: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("organizationid", organizationid)
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


// lib/posts.ts

export const checkIsMemberOfOrganization = async (organizationid: string) => {
  const supabase = createClient();
  const currentUser = await getUser();

  if (currentUser) {
    const { data, error } = await supabase
      .from("organizationmembers")
      .select("*")
      .eq("userid", currentUser.user?.id)
      .eq("organizationid", organizationid);
      
    if (!error && data.length > 0) {
      return true;
    }
  }
  return false;
};


export async function updatePost(updatedPost: {
  postid: string;
  content?: string;
  privacyLevel?: string;
  postphotos?: string[];
}) {
  const supabase = createClient();
  try {
    // Only include fields that are provided in the updatedPost object
    const updateFields: any = {};
    if (updatedPost.content) updateFields.content = updatedPost.content;
    if (updatedPost.privacyLevel) updateFields.privacylevel = updatedPost.privacyLevel;
    if (updatedPost.postphotos !== undefined) updateFields.postphotos = updatedPost.postphotos;

    const { data, error } = await supabase
      .from("posts")
      .update(updateFields)
      .eq("postid", updatedPost.postid)
      .select()
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


export async function deletePost(postid: string, authorid: string) {
  const supabase = createClient();
  try {
    // Check if the current user is the author of the post
    const currentUser = await getUser();
    if (!currentUser || currentUser.user?.id !== authorid) {
      console.error("Unauthorized: Only the author can delete this post");
      return { data: null, error: { message: "Unauthorized: Only the author can delete this post" } };
    }

    // Delete the post if the current user is the author
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("postid", postid);

    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred while deleting the post" },
    };
  }
}

export async function getAuthorDetails(authorid: string) {
  const supabase = createClient();
  try {
    // Fetch the author's first name and profile picture
    const { data, error } = await supabase.from("userprofiles")
      .select("first_name, last_name, profilepicture")
      .eq("userid", authorid)
      .single();
    
    if (error) {
      console.error("Error fetching author's details:", error.message);
      return { first_name: null, last_name: null, profilepicture: null };
    }

    return {
      first_name: data?.first_name || null,
      last_name: data?.last_name || null,
      profilepicture: data?.profilepicture || null
    };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      first_name: null,
      last_name: null,
      profilepicture: null
    };
  }
}
