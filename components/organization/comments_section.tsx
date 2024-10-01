"use client";

import { useState, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserCircleIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Menu, Transition } from "@headlessui/react";
import { timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  insertComment,
  deleteComment,
  updateComment,
  check_permissions,
} from "@/lib/posts_tab";
import { useUser } from "@/context/user_context";
import Swal from "sweetalert2";
import { PostComments } from "@/types/post_comments";

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
  const [comments, setComments] = useState<PostComments[]>(
    (initialComments ?? []).sort(
      (a: PostComments, b: PostComments) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  );

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

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("org_post_comments_view")
        .select("commentid, created_at, comment, author")
        .eq("postid", postId);

      if (error) {
        console.error("Error fetching comments: ", error);
        return;
      }

      // Sort comments by created_at date
      const sortedComments = ((data as PostComments[]) ?? []).sort(
        (a: PostComments, b: PostComments) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Update state to trigger re-render
      setComments((prevComments) => {
        // Only update the state if there is a change to the comments
        if (JSON.stringify(prevComments) !== JSON.stringify(sortedComments)) {
          return sortedComments;
        }
        return prevComments;
      });
    } catch (error) {
      console.error("Exception fetching comments: ", error);
    }
  };

  useEffect(() => {
    const channels = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        (payload) => {
          fetchComments();
        }
      )
      .subscribe();
  }, []);

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
          text:
            deleteResult.error.message || "Unable to delete comment. Please try again.",
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
    <div className="mx-auto max-w-4xl rounded-md bg-[#171717] p-3 font-poppins shadow-sm">
      {canComment && (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-3 flex items-center"
      >
        <div className="flex-1 border-b border-fadedgrey">
        <textarea
          {...register("commentText")}
          placeholder="Add a comment..."
          rows={1}
          maxLength={100}
          className="w-full resize-none bg-transparent border-transparent text-sm text-white focus:outline-none h-auto overflow-hidden"
          disabled={isLoading}
          onInput={(e) => {
        e.currentTarget.style.height = "auto";
        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }}
        />
        </div>
        <button
        type="submit"
        disabled={isLoading}
        className={`rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white hover:bg-primarydark ${
          isLoading ? "cursor-not-allowed opacity-50" : ""
        }`}
        >
        {isLoading ? "Submitting..." : "Submit"}
        </button>
      </form>
      )}

      {comments.length > 0 && (
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-xs text-primary hover:underline"
      >
        {showComments ? "Hide Comments" : `Show Comments (${comments.length})`}
      </button>
      )}

      {showComments && (
      <div>
        {Array.isArray(comments) && comments.length > 0 ? (
        comments.map((comment) => (
          <div
          key={comment.commentid}
          className="flex space-x-3 rounded-md bg-[#171717] p-3"
          >
          <div className="flex-shrink-0">
            {comment.author.profile_picture ? (
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${comment.author.profile_picture}`}
              alt={`${comment.author.first_name} ${comment.author.last_name}'s profile`}
              className="h-8 w-8 rounded-full object-cover"
            />
            ) : (
            <UserCircleIcon className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
              {comment.author.first_name} {comment.author.last_name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
              {timeAgo(comment.created_at)} ago
              </p>
            </div>
            {(user?.id === comment.author.id || canDeleteComments) && (
              <Menu as="div" className="relative">
              <Menu.Button>
                <EllipsisVerticalIcon className="h-4 w-4 text-gray-400" />
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
                <Menu.Items className="absolute right-0 z-10 mt-2 w-36 rounded-md bg-charleston shadow-md ring-1 ring-black ring-opacity-5">
                  {user?.id === comment.author.id && (
                  <Menu.Item>
                    {({ active }) => (
                    <button
                      onClick={() => handleEdit(comment.commentid, comment.comment)}
                      className={`flex w-full items-center rounded-md p-2 text-sm text-gray-300 ${
                      active ? "bg-gray-700" : ""
                      }`}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" /> Edit
                    </button>
                    )}
                  </Menu.Item>
                  )}
                  {(user?.id === comment.author.id || canDeleteComments) && (
                  <Menu.Item>
                    {({ active }) => (
                    <button
                      onClick={() => handleDelete(comment.commentid, comment.author.id)}
                      className={`flex w-full items-center rounded-md p-2 text-sm text-gray-300 ${
                      active ? "bg-gray-700" : ""
                      }`}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" /> Delete
                    </button>
                    )}
                  </Menu.Item>
                  )}
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
              rows={1}
              className="w-full resize-none border-b border-[#424242] bg-transparent p-1 text-sm text-white focus:border-primary focus:outline-none"
              />
              <div className="mt-2 flex space-x-3">
              <button
                onClick={handleUpdateComment}
                className="text-xs text-blue-500 hover:underline"
                disabled={isUpdating === comment.commentid}
              >
                {isUpdating === comment.commentid ? "Updating..." : "Update"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancel
              </button>
              </div>
            </div>
            ) : (
            <p className="mt-1 text-sm text-white">{comment.comment}</p>
            )}
          </div>
          </div>
        ))
        ) : (
        <p className="text-sm text-white">No comments yet.</p>
        )}
      </div>
      )}
    </div>
  );
};

export default CommentsSection;
