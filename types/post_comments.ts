import { CombinedUserData } from "@/types/combined_user_data";
import { Posts } from "@/types/posts";

export interface PostComments {
  commentid: string;
  created_at: string;
  postid: string;
  authorid?: string;
  comment?: string;
  posts?: Posts;
  combined_user_data?: CombinedUserData;
}
