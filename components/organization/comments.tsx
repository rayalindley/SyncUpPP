import { useState, useEffect, useRef } from "react";
import {
  insertComment,
  updateComment,
  deleteComment,
  fetchComments,
} from "@/lib/comments";
import { getUserProfileById } from "@/lib/userActions";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { z } from "zod";
import { adjustDate } from "@/lib/utils";

const commentSchema = z.object({
  commentText: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(100, "Comment cannot exceed 100 characters"),
});

const editCommentSchema = z.object({
  editingText: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(100, "Comment cannot exceed 100 characters"),
});

interface Comment {
  commentid: string;
  comment: string;
  created_at: string;
  authorid: string;
  authorFirstName?: string;
  authorLastName?: string;
  authorProfilePicture?: string | null;
}

interface CommentsProps {
  postid: string;
}

const Comments: React.FC<CommentsProps> = ({ postid }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [charCount, setCharCount] = useState({ comment: 0, editing: 0 });
  const [errors, setErrors] = useState({ commentText: "", editingText: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useUser();
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public/";

  useEffect(() => {
    setCharCount((prev) => ({ ...prev, comment: commentText.length }));
    setErrors((prev) => ({ ...prev, commentText: "" })); // Clear error on typing
  }, [commentText]);

  useEffect(() => {
    setCharCount((prev) => ({ ...prev, editing: editingText.length }));
    setErrors((prev) => ({ ...prev, editingText: "" })); // Clear error on typing
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [editingText]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: commentsData } = await fetchComments(postid);

      console.log("Fetched comments data:", commentsData);

      if (!commentsData) {
        setComments([]);
        setIsLoading(false);
        return;
      }

      const commentsWithDetails = await Promise.all(
        commentsData.map(async (comment: Comment) => {
          const { data: authorData } = await getUserProfileById(comment.authorid);
          return {
            ...comment,
            created_at: adjustDate(comment.created_at),
            authorFirstName: authorData?.first_name ?? "",
            authorLastName: authorData?.last_name ?? "",
            authorProfilePicture: authorData?.profilepicture
              ? `${supabaseStorageBaseUrl}/${authorData.profilepicture}`
              : null,
          };
        })
      );

      setComments(commentsWithDetails);
      setIsLoading(false);
    };

    fetchData();
    const supabase = createClient();
    supabase
      .channel("comments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        fetchData
      )
      .subscribe();
  }, [postid]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      commentSchema.parse({ commentText });
      setErrors((prev) => ({ ...prev, commentText: "" }));
      const formData = { postid, authorid: user?.id, comment: commentText };
      const { data: newComment } = await insertComment(formData);

      // Optimistically add the new comment to the list
      setComments((prevComments) => [
        ...prevComments,
        {
          ...newComment,
          created_at: adjustDate(newComment.created_at),
          authorFirstName: user?.first_name,
          authorLastName: user?.last_name,
          authorProfilePicture: user?.profilepicture
            ? `${supabaseStorageBaseUrl}/${user.profilepicture}`
            : null,
        },
      ]);
      setCommentText("");
      setIsSubmitting(false);
    } catch (e) {
      setIsSubmitting(false);
      if (e instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, commentText: e.errors[0].message }));
      }
    }
  };

  const handleEdit = async () => {
    try {
      setIsSaving(true);
      editCommentSchema.parse({ editingText });
      setErrors((prev) => ({ ...prev, editingText: "" }));
      const { data } = await updateComment({
        commentid: editingCommentId!,
        comment: editingText,
      });
      setComments(
        comments.map((comment) =>
          comment.commentid === editingCommentId
            ? { ...comment, comment: data.comment }
            : comment
        )
      );
      setEditingCommentId(null);
      setEditingText("");
      setIsSaving(false);
    } catch (e) {
      setIsSaving(false);
      if (e instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, editingText: e.errors[0].message }));
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteComment(commentToDelete!, user?.id!);
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.commentid !== commentToDelete)
      );
      setShowDeleteModal(false);
      setCommentToDelete(null);
      setIsDeleting(false);
    } catch (e) {
      setIsDeleting(false);
    }
  };

  const timeElapsed = (date: string) => {
    const elapsed = Date.now() - new Date(date).getTime();
    const minute = 60000;
    const hour = 3600000;
    const day = 86400000;
    const month = day * 30;
    const year = day * 365;

    if (elapsed < minute) {
      return "just now";
    } else if (elapsed < hour) {
      return `${Math.floor(elapsed / minute)} minute${Math.floor(elapsed / minute) !== 1 ? "s" : ""} ago`;
    } else if (elapsed < day) {
      return `${Math.floor(elapsed / hour)} hour${Math.floor(elapsed / hour) !== 1 ? "s" : ""} ago`;
    } else if (elapsed < month) {
      return `${Math.floor(elapsed / day)} day${Math.floor(elapsed / day) !== 1 ? "s" : ""} ago`;
    } else if (elapsed < year) {
      return `${Math.floor(elapsed / month)} month${Math.floor(elapsed / month) !== 1 ? "s" : ""} ago`;
    } else {
      return `${Math.floor(elapsed / year)} year${Math.floor(elapsed / year) !== 1 ? "s" : ""} ago`;
    }
  };

  return (
    <div className="mx-auto max-w-xl p-4">
      {user ? (
        <div className="mb-4">
          <div className="relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter your comment..."
              rows={commentText.length > 50 ? 3 : 1}
              maxLength={100}
              className="w-full resize-none rounded-lg border border-[#424242] bg-[#1c1c1c] p-2 text-sm leading-5 text-white caret-white focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-[#858585]">
              {charCount.comment}/100
            </div>
          </div>
          {errors.commentText && (
            <div className="mt-1 text-xs text-red-500">{errors.commentText}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      ) : (
        <div className="mb-4 text-sm text-[#858585]">
          You must be logged in to comment.
        </div>
      )}
      <div>
        {comments.length === 0 && isLoading ? (
          <div className="p-5 text-center text-[#858585]">
            Loading comments...
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.commentid} className="flex border-t border-[#424242] py-2">
              <div className="mr-2 flex h-10 w-10 items-center justify-center">
                {comment.authorProfilePicture ? (
                  <img
                    src={comment.authorProfilePicture}
                    alt="Profile"
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#424242]">
                    <UserCircleIcon className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 break-all">
                <div className="text-sm text-white">
                  {comment.authorFirstName} {comment.authorLastName}
                  <span className="ml-2 text-xs text-[#858585]">
                    • {timeElapsed(comment.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-white whitespace-pre-wrap break-all">
                  {editingCommentId === comment.commentid ? (
                    <div className="relative">
                      <textarea
                        ref={editTextareaRef}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        placeholder="Enter your comment..."
                        rows={1}
                        maxLength={100}
                        className="w-full resize-none overflow-hidden rounded-lg border border-[#424242] bg-[#1c1c1c] p-2 text-sm leading-5 text-white caret-white focus:border-primary"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleEdit();
                          }
                        }}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-[#858585]">
                        {charCount.editing}/100
                      </div>
                      {errors.editingText && (
                        <div className="mt-1 text-xs text-red-500">
                          {errors.editingText}
                        </div>
                      )}
                      <button
                        onClick={handleEdit}
                        disabled={isSaving}
                        className="mr-2 mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="mt-2 rounded-lg bg-[#424242] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-all">{comment.comment}</p>
                  )}
                </div>
                {user?.id === comment.authorid &&
                  editingCommentId !== comment.commentid && (
                    <div className="mt-1 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.commentid);
                          setEditingText(comment.comment);
                        }}
                        className="cursor-pointer text-sm text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setCommentToDelete(comment.commentid);
                        }}
                        className="cursor-pointer text-sm text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))
        )}
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-75">
          <div className="rounded-lg bg-[#1c1c1c] p-4 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold text-white">Delete Comment</h2>
            <p className="mb-4 text-white">
              Are you sure you want to delete this comment?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg bg-[#424242] px-4 py-2 text-sm font-semibold text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;
