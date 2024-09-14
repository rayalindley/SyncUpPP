import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertComment, fetchComments, deleteComment, updateComment, check_permissions, getAuthorDetails } from "@/lib/groups/posts_tab";
import { useUser } from "@/context/user_context";
import { PostComments } from "@/types/post_comments";
import { UserCircleIcon } from "@heroicons/react/24/solid";

const commentSchema = z.object({
  commentText: z.string().min(1, "Comment cannot be empty").max(100, "Comment cannot exceed 100 characters"),
});

interface CommentsSectionProps {
  postId: string;
  organizationId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ postId, organizationId }) => {
  const { user } = useUser();
  const [comments, setComments] = useState<PostComments[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Separate loading state for updating comments
  const [canComment, setCanComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true); // New state for comments loading
  const { register, handleSubmit, reset } = useForm<{ commentText: string }>({
    resolver: zodResolver(commentSchema),
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      setPermissionsLoading(true);
      if (user) {
        const permission = user?.id ? await check_permissions(user.id, organizationId, "comment_on_posts") : false;
        setCanComment(!!permission);
      }
      setPermissionsLoading(false);
    };
    fetchPermissions();
  }, [user, organizationId]);

  useEffect(() => {
    const loadComments = async () => {
      setCommentsLoading(true); // Start loading
      const data = await fetchComments(postId);
      if (data && !data.error) {
        const commentsWithAuthorDetails = await Promise.all(
          data.data.map(async (comment: PostComments) => {
            const authorDetails = await getAuthorDetails(comment.authorid!);
            return {
              ...comment,
              combined_user_data: authorDetails || {},
            };
          })
        );
        setComments(commentsWithAuthorDetails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } else {
        setComments([]);
      }
      setCommentsLoading(false); // Stop loading
    };
    loadComments();
  }, [postId]);

  const onSubmit = async (data: { commentText: string }) => {
    if (!canComment) return;

    setIsLoading(true);
    try {
      const newComment = await insertComment({
        postid: postId,
        authorid: user?.id,
        comment: data.commentText,
      });
      setComments((prev) => [newComment.data, ...prev]);
      reset();
    } catch (error) {
      console.error("Failed to submit comment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId, user?.id!);
      setComments((prev) => prev.filter((comment) => comment.commentid !== commentId));
    } catch (error) {
      console.error("Failed to delete comment.");
    }
  };

  const handleEdit = (commentId: string, commentText: string) => {
    setEditingCommentId(commentId);
    setEditingText(commentText);
  };

  const handleEditChange = (newCommentText: string) => {
    setEditingText(newCommentText);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingText) return;

    setIsUpdating(editingCommentId); // Start loading for the specific comment being updated
    try {
      const updatedComment = await updateComment(editingCommentId, { comment: editingText }, { commentid: editingCommentId, comment: editingText });
      if (updatedComment.data) {
        setComments((prev) =>
          prev.map((comment) => (comment.commentid === editingCommentId ? { ...updatedComment.data, combined_user_data: comment.combined_user_data } : comment))
        );
      }
      setEditingCommentId(null);
      setEditingText(null);
    } catch (error) {
      console.error("Failed to update comment.");
    } finally {
      setIsUpdating(null); // Stop loading after the update
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText(null);
  };

  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="mx-auto max-w-xl">
      {permissionsLoading ? (
        <p className="text-white">Loading permissions...</p>
      ) : canComment ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
          <textarea
            {...register("commentText")}
            placeholder="Enter your comment..."
            rows={2}
            maxLength={100}
            className="w-full resize-none rounded-lg border border-[#424242] bg-[#1c1c1c] p-2 text-sm text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`mt-2 rounded-lg px-4 py-2 text-sm ${isLoading ? "bg-gray-500" : "bg-primary text-white"}`}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
      ) : (
        <p className="text-white">You do not have permission to comment on this post.</p>
      )}

      <button onClick={() => setShowComments(!showComments)} className="mb-4 text-sm text-blue-500">
        {showComments ? "Hide Comments" : "Show Comments"}
      </button>

      {showComments && (
        commentsLoading ? (
          <p className="text-white">Loading comments...</p> // Loading message or animation
        ) : (
          comments.map((comment) => (
            <div key={comment.commentid} className="flex border-t border-[#424242] py-2">
              <div className="mr-2 flex items-center">
                {comment.combined_user_data?.profilepicture ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${comment.combined_user_data.profilepicture}`}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-white">
                    {comment.combined_user_data?.first_name} {comment.combined_user_data?.last_name}
                  </p>
                  <p className="text-sm text-gray-400">{formatDateTime(comment.created_at)}</p>
                </div>

                {editingCommentId === comment.commentid ? (
                  <div>
                    <textarea
                      value={editingText || ""}
                      onChange={(e) => handleEditChange(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-[#424242] bg-[#1c1c1c] p-2 text-sm text-white"
                    />
                    <div className="flex space-x-4 mt-2">
                      <button onClick={handleUpdateComment} className="text-sm text-blue-500" disabled={isUpdating === comment.commentid}>
                        {isUpdating === comment.commentid ? "Updating..." : "Update"}
                      </button>
                      <button onClick={handleCancelEdit} className="text-sm text-gray-500">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white">{comment.comment}</p>
                )}

                {user?.id === comment.authorid && editingCommentId !== comment.commentid && (
                  <div className="flex space-x-4">
                    <button onClick={() => handleEdit(comment.commentid, comment.comment)} className="text-sm text-blue-500">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(comment.commentid)} className="text-sm text-red-500">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
};

export default CommentsSection;