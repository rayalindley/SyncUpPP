import { useState, useEffect, ChangeEvent } from "react";
import {
  insertComment,
  updateComment,
  deleteComment,
  fetchComments,
} from "@/lib/comments";
import { getCombinedUserDataById, getUserProfileById } from "@/lib/userActions";
import { UserCircleIcon } from "@heroicons/react/16/solid";
import { useUser } from "@/context/UserContext";

interface CommentProps {
  postid: string;
  authorid: string;
}

interface Comment {
  commentid: string;
  authorid: string;
  comment: string;
  created_at: string;
  authorFirstName: string;
  authorLastName: string;
  authorProfilePicture: string | null;
}

export default function Comment({ postid }: CommentProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { user } = useUser();
  const supabaseStorageBaseUrl = `https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public/`;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingComments(true);
      const { data: commentsData } = await fetchComments(postid);
      const commentsWithAuthorDetails = await Promise.all(
        commentsData.map(async (comment: Comment) => {
          const { data: authorData } = await getUserProfileById(comment.authorid);
          console.log(supabaseStorageBaseUrl + authorData.profilepicture);
          return {
            ...comment,
            authorFirstName: authorData.first_name,
            authorLastName: authorData.last_name,
            authorProfilePicture: supabaseStorageBaseUrl + authorData.profilepicture,
          };
        })
      );
      setComments(commentsWithAuthorDetails);
      setIsLoadingComments(false);
    };
    fetchData();
  }, [postid]);

  const handleCommentSubmit = async () => {
    setIsLoading(true);
    const formData = { postid, authorid: user?.id, comment: commentText };
    const { data } = await insertComment(formData);
    setComments([
      ...comments,
      {
        ...data,
        authorFirstName: user?.firstName,
        authorLastName: user?.lastName,
        authorProfilePicture: user?.profilepicture,
      },
    ]);
    setCommentText("");
    setIsLoading(false);
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.commentid);
    setEditingText(comment.comment);
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    const formData = { commentid: editingCommentId, comment: editingText };
    const { data } = await updateComment(formData);
    const updatedComments = comments.map((comment) =>
      comment.commentid === editingCommentId
        ? { ...comment, comment: data.comment }
        : comment
    );
    setComments(updatedComments);
    setEditingCommentId(null);
    setEditingText("");
    setIsLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleDeleteComment = async (commentid: string) => {
    setIsLoading(true);
    const { data } = await deleteComment(commentid, user?.id);
    const updatedComments = comments.filter((comment) => comment.commentid !== commentid);
    setComments(updatedComments);
    setShowDeleteModal(false);
    setCommentToDelete(null);
    setIsLoading(false);
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
    postTime.setHours(postTime.getHours() + 8);
    const elapsedTime = currentTime.getTime() - postTime.getTime();
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    else if (hours > 0) return `${hours}h ago`;
    else if (minutes > 0) return `${minutes}m ago`;
    else return `${seconds}s ago`;
  };

  return (
    <div className="max-h-6xl mb-2 mt-2 border-t border-[#525252]">
      <div className="flex flex-row">
        <div className="ml-14 mt-2 pl-1"></div>
        <div className="flex-grow">
          <textarea
            value={commentText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setCommentText(e.target.value)
            }
            placeholder="Enter your comment..."
            rows={3}
            maxLength={100}
            style={{ caretColor: "white", color: "white" }}
            className="min-h-4xl mt-1 h-8 w-full resize-none overflow-hidden border-0 bg-[#1C1C1C] text-white placeholder:text-gray-400 focus:ring-0 sm:text-xs sm:leading-6"
          />
        </div>
        <div className="rounded-md">
          <div className="flex items-center justify-end space-x-3 border-gray-200 px-2 py-2 sm:px-2">
            <div className="flex-shrink-0">
              <button
                onClick={handleCommentSubmit}
                className={`inline-flex items-center rounded-md bg-primary px-2 py-2 text-xs font-semibold text-white shadow-sm ${isLoading || !commentText.trim() ? "bg-primarydark" : "hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"}`}
                disabled={isLoading || !commentText.trim()}
              >
                Submit Comment
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-1 ml-10 mt-2 border-[#525252]">
        {isLoadingComments ? (
          <div
            style={{
              padding: "20px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "0.9em",
              color: "#fff",
            }}
          >
            Loading comments...
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className="mb-2">
              <div className="flex flex-row">
                <div className="ml-4 mr-2 mt-2 pl-1">
                  {comment.authorProfilePicture ? (
                    <img
                      src={comment.authorProfilePicture}
                      alt="Profile"
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-10 w-10 text-[#525252]" />
                  )}
                </div>
                <div className="mt-2 flex flex-col">
                  <div className="mt-1 text-xs text-white">
                    {comment.authorFirstName} {comment.authorLastName}
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
                          maxLength={100}
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
                  {comment.authorid && (
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
          ))
        )}
      </div>
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
