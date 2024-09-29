"use server";
import { createClient, getUser } from "@/lib/supabase/server";
//import { getVisiblePostsAndComments } from "@/lib/posts_tab"; 

export async function getVisiblePostsAndComments(p_user_id: string, p_org_id: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .rpc('get_visible_posts_and_comments', {
        p_user_id,
        p_org_id
      });

    if (!error) {
      return { data, error: null };
    } else {
      return { data: null, error };
    }
  } catch (error) {
    return { data: null, error };
  }
}

// It returns rows from the following view.
/*create view
  public.org_posts_and_comments_view as
select
  p.postid,
  p.organizationid,
  p.authorid,
  p.content,
  p.createdat,
  p.postphotos,
  o.name as organization_name,
  o.description as organization_description,
  o.website as organization_website,
  o.created_at as organization_created_at,
  jsonb_build_object(
    'first_name',
    up.first_name,
    'last_name',
    up.last_name,
    'profile_picture',
    up.profilepicture
  ) as author_details,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'commentid',
          c.commentid,
          'created_at',
          c.created_at,
          'comment',
          c.comment,
          'author',
          jsonb_build_object(
            'id',
            au.id,
            'first_name',
            upc.first_name,
            'last_name',
            upc.last_name,
            'profile_picture',
            upc.profilepicture
          )
        )
      ) as jsonb_agg
    from
      post_comments c
      join auth.users au on c.authorid = au.id
      join userprofiles upc on au.id = upc.userid
    where
      c.postid = p.postid
  ) as comments,
  jsonb_build_object(
    'role_privacy',
    (
      select
        jsonb_agg(
          jsonb_build_object(
            'role_id',
            r.role_id,
            'role',
            r.role,
            'color',
            r.color,
            'permissions',
            (
              select
                jsonb_agg(p_1.perm_key) as jsonb_agg
              from
                role_permissions rp
                join permissions p_1 on rp.perm_key::text = p_1.perm_key::text
              where
                rp.role_id = r.role_id
            )
          )
        ) as jsonb_agg
      from
        post_roles pr
        join organization_roles r on pr.roleid = r.role_id
      where
        pr.postid = p.postid
    ),
    'membership_privacy',
    (
      select
        jsonb_agg(
          jsonb_build_object(
            'membership_id',
            m.membershipid,
            'name',
            m.name,
            'description',
            m.description,
            'registration_fee',
            m.registrationfee,
            'features',
            m.features,
            'mostPopular',
            m."mostPopular",
            'yearlydiscount',
            m.yearlydiscount
          )
        ) as jsonb_agg
      from
        post_memberships pm
        join memberships m on pm.membershipid = m.membershipid
      where
        pm.postid = p.postid
    )
  ) as privacy
from
  posts p
  join organizations o on p.organizationid = o.organizationid
  join auth.users u on p.authorid = u.id
  join userprofiles up on u.id = up.userid;
*/

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

export async function deleteComment(commentid: string, user_id: string) {
  const supabase = createClient();
  try {
    // Step 1: Fetch the comment's authorid and postid
    const { data: comment, error: fetchError } = await supabase
      .from("post_comments")
      .select("authorid, postid")
      .eq("commentid", commentid)
      .single();

    if (fetchError || !comment) {
      console.error("Comment not found or fetch error:", fetchError?.message);
      return { data: null, error: { message: "Comment not found" } };
    }

    const { authorid, postid } = comment;

    // Step 2: Fetch the organizationid from the post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("organizationid")
      .eq("postid", postid)
      .single();

    if (postError || !post) {
      console.error("Post not found or fetch error:", postError?.message);
      return { data: null, error: { message: "Post not found" } };
    }

    const { organizationid } = post;

    // Step 3: Check if the user is the author
    const isAuthor = authorid === user_id;

    // Step 4: Check if the user has delete_comments permission
    const hasDeletePermission = await check_permissions(user_id, organizationid, "delete_comments");

    if (!isAuthor && !hasDeletePermission) {
      console.error("Unauthorized: Only the author or users with delete permissions can delete this comment");
      return {
        data: null,
        error: { message: "Unauthorized: Only the author or users with delete permissions can delete this comment" },
      };
    }

    // Step 5: Proceed to delete the comment
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
