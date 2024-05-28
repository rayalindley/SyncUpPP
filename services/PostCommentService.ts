// services/PostCommentService.ts
import { PostComment } from "../models/PostComment";
import { SupabaseClient } from "@supabase/supabase-js";

export class PostCommentService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createPostComment(postComment: PostComment): Promise<PostComment> {
    const { data, error } = await this.supabase
      .from("post_comments")
      .insert(postComment)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new PostComment(
      data.commentId,
      new Date(data.createdAt),
      data.postId,
      data.authorId,
      data.comment
    );
  }

  async getPostCommentById(commentId: string): Promise<PostComment | null> {
    const { data, error } = await this.supabase
      .from("post_comments")
      .select("*")
      .eq("commentId", commentId)
      .single();
    if (error) return null;
    return new PostComment(
      data.commentId,
      new Date(data.createdAt),
      data.postId,
      data.authorId,
      data.comment
    );
  }

  async updatePostComment(
    commentId: string,
    updates: Partial<PostComment>
  ): Promise<PostComment | null> {
    const { data, error } = await this.supabase
      .from("post_comments")
      .update(updates)
      .eq("commentId", commentId)
      .select()
      .single();
    if (error) return null;
    return new PostComment(
      data.commentId,
      new Date(data.createdAt),
      data.postId,
      data.authorId,
      data.comment
    );
  }

  async deletePostComment(commentId: string): Promise<void> {
    const { error } = await this.supabase
      .from("post_comments")
      .delete()
      .eq("commentId", commentId);
    if (error) throw new Error(error.message);
  }
}
