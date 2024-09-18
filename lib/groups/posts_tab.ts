"use server";
import { createClient, getUser } from "@/lib/supabase/server";

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
    } else {
      console.error("Error checking membership or user is not a member:", error);
    }
  } else {
    console.error("No current user found");
  }
  return false;
};

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

export async function updateComment(
  editingCommentId: string,
  p0: { comment: string },
  updatedComment: {
    commentid: string;
    comment?: string;
  }
) {
  const supabase = createClient();
  try {
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
    const { data: comment, error: fetchError } = await supabase
      .from("post_comments")
      .select("authorid")
      .eq("commentid", commentid)
      .single();

    if (fetchError || !comment) {
      console.error("Comment not found or fetch error:", fetchError?.message);
      return { data: null, error: { message: "Comment not found" } };
    }

    if (comment.authorid !== authorid) {
      console.error("Unauthorized: Only the author can delete this comment");
      return {
        data: null,
        error: { message: `Unauthorized: Only the author can delete this comment` },
      };
    }

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
export async function insertPost(formData: any, organizationid: string) {
  const supabase = createClient();

  const insertValues = {
    content: formData.content,
    organizationid: organizationid,
    postphotos: formData.postphotos || [],
    authorid: formData.authorid,
    createdat: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("posts")
    .insert([insertValues])
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  const postId = data.postid;

  if (formData.targetroles && formData.targetroles.length > 0) {
    const roleInserts = formData.targetroles.map((roleid: string) => ({
      postid: postId,
      roleid: roleid,
    }));

    const { error: roleError } = await supabase.from("post_roles").insert(roleInserts);
    if (roleError) {
      console.error("Error inserting post roles:", roleError.message);
      return { data: null, error: { message: roleError.message } };
    }
  }

  if (formData.targetmemberships && formData.targetmemberships.length > 0) {
    const membershipInserts = formData.targetmemberships.map((membershipid: string) => ({
      postid: postId,
      membershipid: membershipid,
    }));

    const { error: membershipError } = await supabase
      .from("post_memberships")
      .insert(membershipInserts);
    if (membershipError) {
      console.error("Error inserting post memberships:", membershipError.message);
      return { data: null, error: { message: membershipError.message } };
    }
  }

  return { data, error: null };
}

export async function updatePost(updatedPost: {
  postid: string;
  content?: string;
  postphotos?: string[];
  targetroles?: string[];
  targetmemberships?: string[];
}) {
  const supabase = createClient();

  const updateFields: any = {
    ...(updatedPost.content && { content: updatedPost.content }),
    ...(updatedPost.postphotos !== undefined && { postphotos: updatedPost.postphotos }),
  };

  const { data, error } = await supabase
    .from("posts")
    .update(updateFields)
    .eq("postid", updatedPost.postid)
    .select()
    .single();

  if (error) {
    return { data: null, error: { message: error.message } };
  }

  if (updatedPost.targetroles) {
    await supabase.from("post_roles").delete().eq("postid", updatedPost.postid);

    if (updatedPost.targetroles.length > 0) {
      const roleInserts = updatedPost.targetroles.map((roleid: string) => ({
        postid: updatedPost.postid,
        roleid: roleid,
      }));

      const { error: roleError } = await supabase.from("post_roles").insert(roleInserts);
      if (roleError) {
        console.error("Error updating post roles:", roleError.message);
        return { data: null, error: { message: roleError.message } };
      }
    }
  }

  if (updatedPost.targetmemberships) {
    await supabase.from("post_memberships").delete().eq("postid", updatedPost.postid);

    if (updatedPost.targetmemberships.length > 0) {
      const membershipInserts = updatedPost.targetmemberships.map(
        (membershipid: string) => ({
          postid: updatedPost.postid,
          membershipid: membershipid,
        })
      );

      const { error: membershipError } = await supabase
        .from("post_memberships")
        .insert(membershipInserts);
      if (membershipError) {
        console.error("Error updating post memberships:", membershipError.message);
        return { data: null, error: { message: membershipError.message } };
      }
    }
  }

  return { data, error: null };
}

export async function deletePost(postid: string, authorid: string) {
  const supabase = createClient();
  const currentUser = await getUser();
  if (!currentUser || currentUser.user?.id !== authorid) {
    return {
      data: null,
      error: { message: "Unauthorized: Only the author can delete this post" },
    };
  }
  const { data, error } = await supabase.from("posts").delete().eq("postid", postid);
  return !error
    ? { data, error: null }
    : { data: null, error: { message: error.message } };
}

export async function getAuthorDetails(authorid: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("userprofiles")
    .select("first_name, last_name, profilepicture")
    .eq("userid", authorid)
    .single();
  return !error ? data : { first_name: null, last_name: null, profilepicture: null };
}

export async function getUserProfileById(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_user_profile_by_id", {
    user_id: userId,
  });
  return !error && data
    ? { data: data[0], error: null }
    : { data: null, error: error || { message: "No data found" } };
}
// Utility function to validate UUIDs
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export async function check_permissions(
  userid: string,
  org_id: string,
  perm_key: string
): Promise<boolean> {
  // Validate the userid before proceeding
  if (!userid || !isValidUUID(userid)) {
    console.warn(`check_permissions called with invalid userid: "${userid}"`);
    return false;
  }

  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc("check_org_permissions", {
      p_user_id: userid,
      p_org_id: org_id,
      p_perm_key: perm_key,
    });

    if (error) {
      console.error("Error checking permissions", error);
      return false;
    }

    // Assuming 'data' is a boolean indicating permission
    return data ?? false;
  } catch (error) {
    console.error("Unexpected error in check_permissions:", error);
    return false;
  }
}

export async function getUserOrganizationInfo(userId: string, organizationid: string) {
  const supabase = createClient();
  const { data } = await supabase
    .rpc("get_user_organization_info", {
      user_id: userId,
      organization_id: organizationid,
    })
    .single();
  return data;
}

export async function fetchComments(postid: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("postid", postid)
    .order("created_at", { ascending: true });
  return !error
    ? { data, error: null }
    : { data: null, error: { message: error.message } };
}

export async function getMemberships(id: string) {
  const supabase = createClient();
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("organizationid", id);
  return !error ? memberships : [];
}

export async function fetchMembershipById(membershipId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("membershipid", membershipId)
    .single();
  return !error
    ? { data, error: null }
    : { data: null, error: { message: error.message } };
}

export async function fetchEvents(
  organizationid: string,
  currentPage: number,
  eventsPerPage: number
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizationid", organizationid)
    .range(currentPage * eventsPerPage - eventsPerPage, currentPage * eventsPerPage)
    .order("createdat", { ascending: false });
  return !error
    ? { data, error: null }
    : { data: null, error: { message: error.message } };
}

export async function fetchPosts(organizationid: string, userid: string | null) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("get_visible_posts", {
      p_user_id: userid,
      p_org_id: organizationid,
    });

    if (!error) {
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

export async function fetchRolesAndMemberships(organizationId: string) {
  const supabase = createClient();

  const { data: rolesData, error: rolesError } = await supabase
    .from("organization_roles")
    .select("role_id, role")
    .eq("org_id", organizationId);

  if (rolesError) {
    return { roles: [], memberships: [], error: rolesError.message };
  }

  const { data: membershipsData, error: membershipsError } = await supabase
    .from("memberships")
    .select("membershipid, name")
    .eq("organizationid", organizationId);

  if (membershipsError) {
    return { roles: [], memberships: [], error: membershipsError.message };
  }

  const roles = rolesData.map((role: { role_id: string; role: string }) => ({
    id: role.role_id,
    name: role.role,
  }));

  const memberships = membershipsData.map(
    (membership: { membershipid: string; name: string }) => ({
      membershipid: membership.membershipid,
      name: membership.name,
    })
  );

  return { roles, memberships, error: null };
}

export const fetchPostRoles = async (postId: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_roles")
    .select("roleid")
    .eq("postid", postId);

  if (error) {
    console.error("Error fetching post roles:", error.message);
    return [];
  }

  return data.map((record: { roleid: string }) => record.roleid);
};

export const fetchPostMemberships = async (postId: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_memberships")
    .select("membershipid")
    .eq("postid", postId);

  if (error) {
    console.error("Error fetching post memberships:", error.message);
    return [];
  }

  return data.map((record: { membershipid: string }) => record.membershipid);
};
