import { Memberships } from "./memberships";
import { Organizations } from "./organizations";
import { Combined_user_data } from "./users";

export interface Posts {
  postid: string /* primary key */;
  organizationid: string /* foreign key to organizations.organizationid */;
  authorid: string /* foreign key to combined_user_data.id */;
  content?: string;
  privacylevel?: any; // type unknown;
  targetmembershipid?: string /* foreign key to memberships.membershipid */;
  createdat?: string;
  postphotos?: string[];
  organizations?: Organizations;
  combined_user_data?: Combined_user_data;
  memberships?: Memberships;
}

export interface Post_comments {
  commentid: string /* primary key */;
  created_at: string;
  postid: string /* foreign key to posts.postid */;
  authorid?: string /* foreign key to combined_user_data.id */;
  comment?: string;
  posts?: Posts;
  combined_user_data?: Combined_user_data;
}
