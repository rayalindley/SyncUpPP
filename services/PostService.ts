// @/services/PostService.ts

import { createClient, getUser } from "../lib/supabase/server";
import { Post } from "../models_/Post";

export class PostService {
  private supabase = createClient();

  async insertPost(post: Post) {
    try {
      const insertValues = {
        content: post.content,
        organizationid: post.organizationid,
        privacylevel: post.privacylevel,
        postphotos: post.postphotos || [],
      };

      const { data, error } = await this.supabase
        .from("posts")
        .insert([insertValues])
        .select()
        .single();

      if (!error) {
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

  async fetchPosts(organizationid: string) {
    try {
      const { data, error } = await this.supabase
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

  async checkIsMemberOfOrganization(organizationid: string) {
    const currentUser = await getUser();

    if (currentUser) {
      const { data, error } = await this.supabase
        .from("organizationmembers")
        .select("*")
        .eq("userid", currentUser.user?.id)
        .eq("organizationid", organizationid);

      if (!error && data.length > 0) {
        return true;
      }
    }
    return false;
  }

  async updatePost(updatedPost: Post) {
    try {
      const updateFields: Partial<Post> = {};
      if (updatedPost.content) updateFields.content = updatedPost.content;
      if (updatedPost.privacylevel) updateFields.privacylevel = updatedPost.privacylevel;
      if (updatedPost.postphotos !== undefined)
        updateFields.postphotos = updatedPost.postphotos;

      const { data, error } = await this.supabase
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

  async deletePost(postid: string, authorid: string) {
    try {
      const currentUser = await getUser();
      if (!currentUser || currentUser.user?.id !== authorid) {
        console.error("Unauthorized: Only the author can delete this post");
        return {
          data: null,
          error: { message: "Unauthorized: Only the author can delete this post" },
        };
      }

      const { data, error } = await this.supabase
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
        error: {
          message: e.message || "An unexpected error occurred while deleting the post",
        },
      };
    }
  }

  async getAuthorDetails(authorid: string) {
    try {
      const { data, error } = await this.supabase
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
      return { first_name: null, last_name: null, profilepicture: null };
    }
  }
}
