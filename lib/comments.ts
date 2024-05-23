"use server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function insertComment(formData: any) {
  const supabase = createClient();
  try {
    const insertValues = {
      postid: formData.postid,
      authorid: formData.authorid,
      comment: formData.comment,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("post_comments")
      .insert([insertValues])
      .select()
      .single();

    if (!error) {
      return { data, error: null };
    } else {
      console.error("Error inserting comment:", error.message);
      return { data: null, error: { message: error.message } };
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: (e as Error).message || "An unexpected error occurred" },
    };
  }
}

export async function fetchComments(postid: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("postid", postid)
      .order("created_at", { ascending: true });

    if (!error) {
      return { data, error: null };
    } else {
      console.error("Error fetching comments:", error.message);
      return { data: null, error: { message: error.message } };
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      error: { message: (e as Error).message || "An unexpected error occurred" },
    };
  }
}

export async function updateComment(updatedComment: {
  commentid: string;
  comment?: string;
}) {
  const supabase = createClient();
  try {
    // Only include fields that are provided in the updatedPost object
    const updateFields: any = {};
    if (updatedComment.comment) updateFields.comment = updatedComment.comment;

    const { data, error } = await supabase
      .from("post_comments")
      .update(updateFields)
      .eq("commentid", updatedComment.commentid)
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

export async function deleteComment(commentid: string, authorid: string) {
  const supabase = createClient();
  try {
    // Retrieve the comment to ensure it exists and to get the author ID
    const { data: comment, error: fetchError } = await supabase
      .from("post_comments")
      .select("authorid")
      .eq("commentid", commentid)
      .single();

    if (fetchError || !comment) {
      console.error("Comment not found or fetch error:", fetchError?.message);
      return { data: null, error: { message: "Comment not found" } };
    }

    // Check if the current user is the author of the comment
    if (comment.authorid !== authorid) {
      console.error("Unauthorized: Only the author can delete this comment");
      return {
        data: null,
        error: { message: `Unauthorized: Only the author can delete this comment` },
      };
    }

    // Delete the comment if the current user is the author
    const { data, error } = await supabase
      .from("post_comments")
      .delete()
      .eq("commentid", commentid);

    if (error) {
      console.error("Error deleting comment:", error.message);
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (e: any) {
    console.error("Unexpected error:", e.message);
    return {
      data: null,
      error: {
        message: e.message || "An unexpected error occurred while deleting the comment",
      },
    };
  }
}
