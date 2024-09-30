// Filename: D:\Repos\SyncUp\components\dashboard\comments_section.tsx

"use client";

import { useState, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserCircleIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { Menu, Transition } from "@headlessui/react";
import { timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  insertComment,
  deleteComment,
  updateComment,
  check_permissions,
  getVisiblePostsAndComments,
} from "@/lib/posts_tab";
import { useUser } from "@/context/user_context";
import Swal from "sweetalert2";
import { PostComments } from "@/types/post_comments";
import { Posts } from "@/types/posts";

const supabase = createClient();

const commentSchema = z.object({
  commentText: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(100, "Comment cannot exceed 100 characters"),
});

interface CommentsSectionProps {
  postId: string;
  organizationId: string;
  comments?: PostComments[];
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  organizationId,
  comments: initialComments,
}) => {
  const { user } = useUser();
  const [comments, setComments] = useState<PostComments[]>(initialComments ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [canComment, setCanComment] = useState(false);
  const [canDeleteComments, setCanDeleteComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ commentText: string }>({
    resolver: zodResolver(commentSchema),
  });

  const isLoggedIn = user && user.id && user.id.length > 0;

  useEffect(() => {
    // Initial comments update if needed
  }, [initialComments]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isLoggedIn) {
        setCanComment(false);
        setCanDeleteComments(false);
        return;
      }
      try {
        const [commentPermission, deletePermission] = await Promise.all([
          check_permissions(user.id!, organizationId, "comment_on_posts"),
          check_permissions(user.id!, organizationId, "delete_comments"),
        ]);
        setCanComment(!!commentPermission);
        setCanDeleteComments(!!deletePermission);
      } catch (error) {
        setCanComment(false);
        setCanDeleteComments(false);
      }
    };
    fetchPermissions();
  }, [isLoggedIn, user?.id, organizationId]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const userId = isLoggedIn ? user.id : null; // Allow null user_id
        const { data, error } = await getVisiblePostsAndComments(userId ?? null, organizationId);
        if (error) {
          console.error("Error fetching comments:", error);
          return;
        }

        const post: Posts | undefined = data.find((p: Posts) => p.postid === postId);
        if (post) {
          const sortedComments: PostComments[] = (post.comments ?? []).sort(
            (a: PostComments, b: PostComments) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setComments(sortedComments);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error("Exception fetching comments:", error);
        // Handle exception if necessary
      }
    };

    fetchComments();

    const commentsChannel = supabase
      .channel(`comments:postid=${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_comments",
          filter: `postid=eq.${postId}`,
        },
        async (payload) => {
          await fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [postId, organizationId, isLoggedIn, user?.id]);

  const onSubmit = async (data: { commentText: string }) => {
    if (!isLoggedIn || !canComment) {
      return;
    }

    setIsLoading(true);
    try {
      const newCommentResult = await insertComment({
        postid: postId,
        authorid: user.id,
        comment: data.commentText,
      });

      if (newCommentResult && newCommentResult.data) {
        reset();
        Swal.fire({
          icon: "success",
          title: "Submitted!",
          text: "Your comment has been submitted.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: "Unable to submit comment. Please try again.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: "An error occurred while submitting your comment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string, authorId: string) => {
    if (!canDeleteComments && user?.id !== authorId) {
      Swal.fire({
        icon: "error",
        title: "Unauthorized",
        text: "You do not have permission to delete this comment.",
      });
      return;
    }
    try {
      const deleteResult = await deleteComment(commentId, user?.id!);
      if (!deleteResult.error) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Your comment has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });

        setComments((prevComments) =>
          prevComments.filter((comment) => comment.commentid !== commentId)
        );
      } else {
        Swal.fire({
          icon: "error",
          title: "Deletion Failed",
          text: deleteResult.error.message || "Unable to delete comment. Please try again.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Deletion Error",
        text: "An error occurred while deleting the comment.",
      });
    }
  };

  const handleEdit = (commentId: string, commentText: string) => {
    setEditingCommentId(commentId);
    setEditingText(commentText);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingText) {
      return;
    }

    setIsUpdating(editingCommentId);
    try {
      const updatedCommentResult = await updateComment(
        editingCommentId,
        { comment: editingText },
        { commentid: editingCommentId, comment: editingText }
      );

      if (updatedCommentResult && updatedCommentResult.data) {
        setEditingCommentId(null);
        setEditingText(null);
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Your comment has been updated.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Unable to update comment. Please try again.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Error",
        text: "An error occurred while updating your comment.",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText(null);
  };

  return (
    <div className="mx-auto mt-5 max-w-4xl space-y-4 rounded-lg bg-eerieblack p-4 font-poppins shadow">
      {canComment && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
          <textarea
            {...register("commentText")}
            placeholder="Enter your comment..."
            rows={2}
            maxLength={100}
            className="w-full rounded-md border border-fadedgrey bg-charleston p-2 text-light focus:border-primary focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`mt-2 rounded bg-primary px-4 py-2 font-semibold text-white hover:bg-primarydark ${
              isLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}

      {/* Show Comments Button - Always Visible */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="mb-4 text-sm text-blue-500 hover:underline"
      >
        {showComments ? "Hide Comments" : `Show Comments (${comments.length})`}
      </button>

      {showComments &&
        (Array.isArray(comments) && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.commentid} className="rounded-md bg-raisinblack p-3">
              <div className="flex items-center space-x-3">
                {comment.author.profile_picture ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${comment.author.profile_picture}`}
                    alt={`${comment.author.first_name} ${comment.author.last_name}'s profile`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-white" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-light">
                    {comment.author.first_name} {comment.author.last_name}
                  </p>
                  <p className="text-xs text-fadedgrey">
                    {timeAgo(comment.created_at)} ago
                  </p>
                </div>
                {(user?.id === comment.author.id || canDeleteComments) && (
                  <Menu as="div" className="relative">
                    <Menu.Button>
                      <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-700 rounded-md bg-raisinblack shadow-lg ring-1 ring-gray-700 ring-opacity-5 focus:outline-none">
                        <div className="p-1">
                          {user?.id === comment.author.id && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() =>
                                    handleEdit(comment.commentid, comment.comment)
                                  }
                                  className={`${
                                    active ? "bg-gray-700" : "bg-raisinblack"
                                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-white`}
                                >
                                  Edit
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          {(user?.id === comment.author.id || canDeleteComments) && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() =>
                                    handleDelete(comment.commentid, comment.author.id)
                                  }
                                  className={`${
                                    active ? "bg-gray-700" : "bg-raisinblack"
                                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-500`}
                                >
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          )}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                )}
              </div>
              {editingCommentId === comment.commentid ? (
                <div className="mt-2">
                  <textarea
                    value={editingText || ""}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-[#424242] bg-[#1c1c1c] p-2 text-sm text-white focus:border-primary focus:outline-none"
                  />
                  <div className="mt-2 flex space-x-4">
                    <button
                      onClick={handleUpdateComment}
                      className="text-sm text-blue-500 hover:underline"
                      disabled={isUpdating === comment.commentid}
                    >
                      {isUpdating === comment.commentid ? "Updating..." : "Update"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-light">{comment.comment}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-white">No comments yet.</p>
        ))}
    </div>
  );
};

export default CommentsSection;
