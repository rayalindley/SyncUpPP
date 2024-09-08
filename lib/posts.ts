"use server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function insertPost(formData: any, organizationid: string) {
  const supabase = createClient();

  try {
    const insertValues = {
      content: formData.content,
      organizationid: organizationid,
      privacylevel: formData.privacylevel || [], // Ensure this is an array of UUIDs
      postphotos: formData.postphotos || [], // Ensure this is an array
    };

    const { data, error } = await supabase
      .from("posts")
      .insert([insertValues])
      .select()
      .single();

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

export async function fetchPosts(organizationid: string, userid: string | null) {
  const supabase = createClient();

  // Log the input parameters to verify them
  console.log("fetchPosts called with:", { organizationid, userid });

  try {
    const { data, error } = await supabase
      .rpc('get_visible_posts', {
        p_user_id: userid,  // Use the correct parameter name 'p_user_id'
        p_org_id: organizationid,  // Use the correct parameter name 'p_org_id'
      });

    // Log the response data and error
    console.log("RPC get_visible_posts response:", { data, error });

    if (!error) {
      // Log when data is successfully returned
      console.log("fetchPosts success, returning data:", data);
      return { data, error: null };
    } else {
      // Log when an error is encountered
      console.error("fetchPosts error:", error);
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    // Log unexpected errors
    console.error("Unexpected error in fetchPosts:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

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
  privacylevel?: string[];  // Update to handle array of UUIDs
  postphotos?: string[];
}) {
  const supabase = createClient();
  try {
    // Only include fields that are provided in the updatedPost object
    const updateFields: any = {};
    if (updatedPost.content) updateFields.content = updatedPost.content;
    if (updatedPost.privacylevel) updateFields.privacylevel = updatedPost.privacylevel;  // Update to array
    if (updatedPost.postphotos !== undefined)
      updateFields.postphotos = updatedPost.postphotos;

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
      return {
        data: null,
        error: { message: "Unauthorized: Only the author can delete this post" },
      };
    }

    // Delete the post if the current user is the author
    const { data, error } = await supabase.from("posts").delete().eq("postid", postid);

    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: {
        message: e.message || "An unexpected error occurred while deleting the post",
      },
    };
  }
}

export async function getAuthorDetails(authorid: string) {
  const supabase = createClient();
  try {
    // Fetch the author's first name and profile picture
    const { data, error } = await supabase
      .from("userprofiles")
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
      profilepicture: data?.profilepicture || null,
    };
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return {
      first_name: null,
      last_name: null,
      profilepicture: null,
    };
  }
}
