import React, { useState, useEffect, ChangeEvent } from "react";
import {
  insertComment,
  updateComment,
  deleteComment,
  fetchComments,
} from "@/lib/comments";
import { getUserProfileById } from "@/lib/userActions";
import { UserCircleIcon } from "@heroicons/react/16/solid"; // Ensure you have the heroicons package installed

interface CommentProps {
  postid: string;
  authorid: string;
}

interface Comment {
  commentid: string;
  authorid: string;
  comment: string;
  created_at: string;
}

export default function Comment({ postid, authorid }: CommentProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authorFirstName, setAuthorFirstName] = useState("");
  const [authorLastName, setAuthorLastName] = useState("");
  const [authorProfilePicture, setAuthorProfilePicture] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch comments
        const { data: commentsData, error: commentsError } = await fetchComments(postid);
        if (commentsError) {
          console.error("Error fetching comments:", commentsError.message);
        } else {
          setComments(commentsData);
        }

        // Fetch author details
        const { data: authorData, error: authorError } =
          await getUserProfileById(authorid);
        if (authorData) {
          setAuthorFirstName(authorData.first_name);
          setAuthorLastName(authorData.last_name);
          setAuthorProfilePicture(authorData.profilepicture); // Assuming the response has a profile_picture field
          console.log("Author details:", authorData);
        } else {
          console.error("Error fetching author details:", authorError?.message);
        }
      } catch (error) {
        console.error("Unexpected error:", error.message);
      }
    };

    fetchData();
  }, [authorid, postid]);

  const handleCommentSubmit = async () => {
    try {
      setIsLoading(true);
      const formData = {
        postid,
        authorid,
        comment: commentText,
      };

      const { data, error } = await insertComment(formData);

      if (!error) {
        setComments([...comments, data]);
        setCommentText("");
      } else {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error submitting comment:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.commentid);
    setEditingText(comment.comment);
  };

  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);
      const formData = {
        commentid: editingCommentId,
        comment: editingText,
      };

      const { data, error } = await updateComment(formData);

      if (!error) {
        const updatedComments = comments.map((comment) =>
          comment.commentid === editingCommentId
            ? { ...comment, comment: data.comment }
            : comment
        );
        setComments(updatedComments);
        setEditingCommentId(null);
        setEditingText("");
      } else {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error updating comment:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleDeleteComment = async (commentid: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await deleteComment(commentid, authorid);

      if (!error) {
        const updatedComments = comments.filter(
          (comment) => comment.commentid !== commentid
        );
        setComments(updatedComments);
        setShowDeleteModal(false);
        setCommentToDelete(null);
      } else {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error deleting comment:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDeleteModal = (commentid: string) => {
    setCommentToDelete(commentid);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setCommentToDelete(null);
    setShowDeleteModal(false);
  };

  const calculateTimeElapsed = (comment: Comment) => {
    const currentTime = new Date();
    const postTime = new Date(comment.created_at);
    const elapsedTime = currentTime.getTime() - postTime.getTime();
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  return (
    <div className="max-h-6xl mb-2 mt-2 border-t border-[#525252]">
      <div className="flex flex-row">
        <div className="ml-14 mt-2 pl-1">{/* Render author's avatar */}</div>
        <div className="flex-grow">
          <textarea
            value={commentText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setCommentText(e.target.value)
            }
            placeholder="Enter your comment..."
            rows={3}
            style={{ caretColor: "white", color: "white" }}
            className="min-h-4xl mt-1 h-8 w-full resize-none overflow-hidden border-0 bg-[#1C1C1C] text-white placeholder:text-gray-400 focus:ring-0 sm:text-xs sm:leading-6"
          />
        </div>
        <div className="rounded-md">
          <div className="flex items-center justify-end space-x-3 border-gray-200 px-2 py-2 sm:px-2">
            <div className="flex-shrink-0">
              <button
                onClick={handleCommentSubmit}
                className={`inline-flex items-center rounded-md bg-primary px-2 py-2 text-xs font-semibold text-white shadow-sm ${
                  isLoading || !commentText.trim()
                    ? "bg-primarydark"
                    : "hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                }`}
                disabled={isLoading || !commentText.trim()}
              >
                Submit Comment
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-1 ml-10 mt-2 border-[#525252]">
        {comments.map((comment, index) => (
          <div key={index} className="mb-2">
            <div className="flex flex-row">
              <div className="ml-4 mr-2 mt-2 pl-1">
                {authorProfilePicture ? (
                  <img
                    src={authorProfilePicture}
                    alt="Profile"
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-[#525252]" />
                )}
              </div>
              <div className="mt-2 flex flex-col">
                <div className="mt-1 text-xs text-white">
                  {authorFirstName} {authorLastName}
                  <span className="ml-1 text-xs text-gray-600">
                    • {calculateTimeElapsed(comment)}
                  </span>
                </div>
                <div className="text-xs text-white">
                  {editingCommentId === comment.commentid ? (
                    <div>
                      <textarea
                        value={editingText}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          setEditingText(e.target.value)
                        }
                        rows={3}
                        className="mt-1 h-8 w-full resize-none overflow-hidden border-0 bg-[#1C1C1C] text-white placeholder:text-gray-400 focus:ring-0 sm:text-xs sm:leading-6"
                      />
                      <div className="mt-1 flex space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="rounded-md bg-gray-500 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{comment.comment}</p>
                  )}
                </div>
                {comment.authorid === authorid && (
                  <div className="mt-1 flex space-x-2">
                    <button
                      onClick={() => handleEditComment(comment)}
                      className="text-xs text-gray-300 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleShowDeleteModal(comment.commentid)}
                      className="text-xs text-red-300 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-md bg-white p-4 shadow-md">
            <h2 className="text-lg font-semibold">Delete Comment</h2>
            <p>Are you sure you want to delete this comment?</p>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => handleDeleteComment(commentToDelete!)}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="rounded-md bg-gray-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
