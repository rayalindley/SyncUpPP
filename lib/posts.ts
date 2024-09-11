"use server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function insertPost(formData: any, organizationid: string) {
  // console.log("insertPost called with formData:", formData, "and organizationid:", organizationid);
  const supabase = createClient();

  try {
    const insertValues = {
      content: formData.content,
      organizationid: organizationid,
      privacylevel: formData.privacylevel || [],
      targetmembershipid: formData.targetmembershipid || null,
      postphotos: formData.postphotos || [],
    };

    // console.log("Inserting values:", insertValues);

    const { data, error } = await supabase
      .from("posts")
      .insert([insertValues])
      .select()
      .single();

    if (!error) {
      // console.log("Post inserted successfully:", data);
      return { data, error: null };
    } else {
      console.error("Error inserting post:", error.message);
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
  // console.log("fetchPosts called with organizationid:", organizationid, "and userid:", userid);
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_visible_posts", {
      p_user_id: userid,
      p_org_id: organizationid,
    });

    if (!error) {
      // console.log("Fetched posts successfully:", data);
      return { data, error: null };
    } else {
      console.error("fetchPosts error:", error);
      return { data: null, error: { message: error.message } };
    }
  } catch (e: any) {
    console.error("Unexpected error in fetchPosts:", e);
    return {
      data: null,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

export const checkIsMemberOfOrganization = async (organizationid: string) => {
  // console.log("checkIsMemberOfOrganization called with organizationid:", organizationid);
  const supabase = createClient();
  const currentUser = await getUser();

  if (currentUser) {
    // console.log("Current user:", currentUser);
    const { data, error } = await supabase
      .from("organizationmembers")
      .select("*")
      .eq("userid", currentUser.user?.id)
      .eq("organizationid", organizationid);

    if (!error && data.length > 0) {
      // console.log("User is a member of the organization");
      return true;
    } else {
      console.error("Error checking membership or user is not a member:", error);
    }
  } else {
    console.error("No current user found");
  }
  return false;
};

export async function updatePost(updatedPost: {
  postid: string;
  content?: string;
  privacylevel?: string[];
  postphotos?: string[];
}) {
  // console.log("updatePost called with updatedPost:", updatedPost);
  const supabase = createClient();
  try {
    const updateFields: any = {};
    if (updatedPost.content) updateFields.content = updatedPost.content;
    if (updatedPost.privacylevel) updateFields.privacylevel = updatedPost.privacylevel;
    if (updatedPost.postphotos !== undefined)
      updateFields.postphotos = updatedPost.postphotos;

    // console.log("Updating fields:", updateFields);

    const { data, error } = await supabase
      .from("posts")
      .update(updateFields)
      .eq("postid", updatedPost.postid)
      .select()
      .single();

    if (!error) {
      // console.log("Post updated successfully:", data);
      return { data, error: null };
    } else {
      console.error("Error updating post:", error.message);
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
  // console.log("deletePost called with postid:", postid, "and authorid:", authorid);
  const supabase = createClient();
  try {
    const currentUser = await getUser();
    if (!currentUser || currentUser.user?.id !== authorid) {
      console.error("Unauthorized: Only the author can delete this post");
      return {
        data: null,
        error: { message: "Unauthorized: Only the author can delete this post" },
      };
    }

    // console.log("Deleting post with postid:", postid);

    const { data, error } = await supabase.from("posts").delete().eq("postid", postid);

    if (!error) {
      // console.log("Post deleted successfully:", data);
      return { data, error: null };
    } else {
      console.error("Error deleting post:", error.message);
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
  // console.log("getAuthorDetails called with authorid:", authorid);
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("userprofiles")
      .select("first_name, last_name, profilepicture")
      .eq("userid", authorid)
      .single();

    if (error) {
      console.error("Error fetching author's details:", error.message);
      return { first_name: null, last_name: null, profilepicture: null };
    }

    // console.log("Fetched author details:", data);

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