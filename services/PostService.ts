// services/PostService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Post } from "../models/Post";

export class PostService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createPost(post: Post): Promise<Post> {
    const { data, error } = await this.supabase
      .from("posts")
      .insert(post)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return new Post(
      data.postId,
      data.organizationId,
      data.authorId,
      data.content,
      data.privacyLevel,
      data.targetMembershipId,
      new Date(data.createdAt),
      data.postPhotos
    );
  }

  async getPostById(postId: string): Promise<Post | null> {
    const { data, error } = await this.supabase
      .from("posts")
      .select("*")
      .eq("postId", postId)
      .single();
    if (error) return null;
    return new Post(
      data.postId,
      data.organizationId,
      data.authorId,
      data.content,
      data.privacyLevel,
      data.targetMembershipId,
      new Date(data.createdAt),
      data.postPhotos
    );
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<Post | null> {
    const { data, error } = await this.supabase
      .from("posts")
      .update(updates)
      .eq("postId", postId)
      .select()
      .single();
    if (error) return null;
    return new Post(
      data.postId,
      data.organizationId,
      data.authorId,
      data.content,
      data.privacyLevel,
      data.targetMembershipId,
      new Date(data.createdAt),
      data.postPhotos
    );
  }

  async deletePost(postId: string): Promise<void> {
    const { error } = await this.supabase.from("posts").delete().eq("postId", postId);
    if (error) throw new Error(error.message);
  }
}
