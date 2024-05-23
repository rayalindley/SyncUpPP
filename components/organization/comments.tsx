import { useState, useEffect } from "react";
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

const Comments = ({ postid }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [charCount, setCharCount] = useState({ comment: 0, editing: 0 });

  const { user } = useUser();
  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public/";

  useEffect(
    () => setCharCount({ ...charCount, comment: commentText.length }),
    [commentText]
  );
  useEffect(
    () => setCharCount({ ...charCount, editing: editingText.length }),
    [editingText]
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: commentsData } = await fetchComments(postid);
      const commentsWithDetails = await Promise.all(
        commentsData.map(async (comment) => {
          const { data: authorData } = await getUserProfileById(comment.authorid);
          return {
            ...comment,
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
    setIsLoading(true);
    const formData = { postid, authorid: user?.id, comment: commentText };
    const { data: newComment } = await insertComment(formData);
    setComments([
      ...comments,
      {
        ...newComment,
        authorFirstName: user?.first_name,
        authorLastName: user?.last_name,
        authorProfilePicture: user?.profilepicture
          ? `${supabaseStorageBaseUrl}/${user.profilepicture}`
          : null,
      },
    ]);
    setCommentText("");
    setIsLoading(false);
  };

  const handleEdit = async () => {
    setIsLoading(true);
    const { data } = await updateComment({
      commentid: editingCommentId,
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
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    await deleteComment(commentToDelete, user?.id);
    setComments(comments.filter((comment) => comment.commentid !== commentToDelete));
    setShowDeleteModal(false);
    setCommentToDelete(null);
    setIsLoading(false);
  };

  const toPhilippineTime = (date) => new Date(new Date(date).getTime() + 8 * 60 * 60000);
  const timeElapsed = (date) => {
    const elapsed = Date.now() - toPhilippineTime(date).getTime();
    const units = [
      { label: "d", value: 86400000 },
      { label: "h", value: 3600000 },
      { label: "m", value: 60000 },
      { label: "s", value: 1000 },
    ];
    for (let { label, value } of units) {
      const result = Math.floor(elapsed / value);
      if (result > 0) return `${result}${label} ago`;
    }
    return "just now";
  };

  return (
    <div className="mx-auto max-w-xl p-4">
      <div className="mb-4">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Enter your comment..."
          rows={commentText.length > 50 ? 3 : 1}
          maxLength={100}
          className="w-full resize-none rounded-lg border border-[#424242] bg-[#1c1c1c] p-2 text-sm leading-5 text-white caret-white"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="mt-2 text-right text-xs text-[#424242]">
          {charCount.comment}/100
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`mt-2 rounded-lg px-4 py-2 text-sm font-semibold ${
            isLoading ? "cursor-not-allowed bg-[#424242]" : "bg-primary text-white"
          }`}
        >
          Submit
        </button>
      </div>
      <div>
        {comments.length === 0 && isLoading ? (
          <div className="rounded-lg bg-[#171717] p-5 text-center text-white">
            Loading comments...
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className="flex border-t border-[#424242] py-2">
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
              <div className="flex-1">
                <div className="text-sm text-white">
                  {comment.authorFirstName} {comment.authorLastName}
                  <span className="ml-2 text-xs text-[#424242]">
                    • {timeElapsed(comment.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-white">
                  {editingCommentId === comment.commentid ? (
                    <div>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        placeholder="Enter your comment..."
                        rows={1}
                        maxLength={100}
                        className="w-full resize-none rounded-lg border border-[#424242] bg-[#1c1c1c] p-2 text-sm leading-5 text-white caret-white"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleEdit();
                          }
                        }}
                      />
                      <div className="mt-1 text-right text-xs text-[#424242]">
                        {charCount.editing}/100
                      </div>
                      <button
                        onClick={handleEdit}
                        className="mr-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="rounded-lg bg-[#424242] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p>{comment.comment}</p>
                  )}
                </div>
                {user?.id === comment.authorid && (
                  <div className="mt-1 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCommentId(comment.commentid);
                        setEditingText(comment.comment);
                      }}
                      className="cursor-pointer text-sm text-[#424242]"
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
            <p className="mb-4 text-[#424242]">
              Are you sure you want to delete this comment?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Delete
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
