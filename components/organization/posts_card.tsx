import { useState, useEffect, Fragment } from "react";
import { updatePost, deletePost, getAuthorDetails } from "@/lib/posts";
import { getUser } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { UserCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid";
import { ChatBubbleOvalLeftIcon } from "@heroicons/react/20/solid";
import Comment from "./comments";
import { fetchComments } from "@/lib/comments";
import { Transition } from "@headlessui/react";

const PostsCard = ({ post, postsData, setPostsData }) => {
  const { content, createdat, postphoto, authorid, postid, privacylevel } = post;
  const [isCurrentUserAuthor, setIsCurrentUserAuthor] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [editedPhoto, setEditedPhoto] = useState(null);
  const [editedPrivacyLevel, setEditedPrivacyLevel] = useState(privacylevel);
  const [isEditing, setIsEditing] = useState(false);
  const [authorFirstName, setAuthorFirstName] = useState("");
  const [authorLastName, setAuthorLastName] = useState("");
  const [authorProfilePicture, setAuthorProfilePicture] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isImageVisible, setIsImageVisible] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentComponent, setShowCommentComponent] = useState(false);
  const [comments, setComments] = useState([]);
  const [accordionOpen, setAccordionOpen] = useState(false);

  const handleCommentButtonClick = () => {
    setShowCommentComponent(true);
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setValidationError("");
    setEditedContent(content);
    setEditedPhoto(null);
    setEditedPrivacyLevel(privacylevel);
    setIsImageVisible(true);
  };

  const handleRemoveImage = async () => {
    try {
      const { error: updateError } = await updatePost({
        postid: post.postid,
        content: content,
        postphoto: postphoto,
        privacyLevel: privacylevel,
      });
      if (updateError) {
        console.error("Error removing image URL from post:", updateError);
        return;
      }

      const { error: removeError } = await createClient()
        .storage.from("post-images")
        .remove([post.postphoto]);
      if (removeError) {
        console.error("Error removing image from bucket:", removeError);
        toast.error("Error removing image. Please try again.");
        return;
      }
      setShowEditModal(true);
      setIsImageVisible(false);
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) {
      setValidationError("Content should not be empty");
      return;
    }

    setIsLoading(true);
    let newPhotoUrl = postphoto;

    if (editedPhoto) {
      const fileName = `post_${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: uploadResult, error } = await createClient()
        .storage.from("post-images")
        .upload(fileName, editedPhoto, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult) {
        newPhotoUrl = uploadResult.fullPath;
      } else {
        console.error("Error uploading image:", error);
        setIsLoading(false);
        return;
      }
    }

    // Set postphoto to null if image is not visible
    if (!isImageVisible) {
      newPhotoUrl = null;
      post.postphoto = null;
    }

    const { error } = await updatePost({
      postid: post.postid,
      content: editedContent,
      postphoto: newPhotoUrl,
      privacyLevel: editedPrivacyLevel,
    });

    if (!error) {
      // Update the postsData state with the edited post
      const updatedPosts = postsData.map((p) =>
        p.postid === post.postid
          ? {
              ...p,
              content: editedContent,
              postphoto: newPhotoUrl,
              privacylevel: editedPrivacyLevel,
            }
          : p
      );
      setPostsData(updatedPosts);

      setIsLoading(false);
      setEditedPhoto(null);
      setShowEditModal(false);
    } else {
      console.error("Error updating post:", error);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    const { error } = await deletePost(postid, authorid);

    if (!error) {
      // Filter out the deleted post from postsData
      const updatedPosts = postsData.filter((p) => p.postid !== postid);
      setPostsData(updatedPosts);

      setIsLoading(false);
      setShowDeleteModal(false);
    } else {
      console.error("Error deleting post:", error);
      setIsLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const checkIsCurrentUserAuthor = async () => {
    const currentUser = await getUser();
    setIsCurrentUserAuthor(currentUser?.user?.id === authorid);
  };

  useEffect(() => {
    const fetchAuthorDetails = async () => {
      try {
        const { first_name, last_name, profilepicture } =
          await getAuthorDetails(authorid);
        setAuthorFirstName(first_name);
        setAuthorLastName(last_name);
        setAuthorProfilePicture(profilepicture);
      } catch (error) {
        console.error("Error fetching author's details:", error);
      }
    };

    const loadComments = async () => {
      try {
        const { data, error } = await fetchComments(postid);
        if (error) {
          console.error("Error fetching comments:", error.message);
        } else {
          setComments(data);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    loadComments();
    fetchAuthorDetails();
    checkIsCurrentUserAuthor();
  }, [authorid, postid]);

  const addComment = (newComment) => {
    setComments([...comments, newComment]);
  };

  const calculateTimeElapsed = () => {
    const currentTime = new Date();
    const postTime = new Date(createdat);
    const elapsedTime = currentTime - postTime;
    const minutes = Math.floor(elapsedTime / 60000);
    if (minutes < 1) {
      return "Just now";
    } else if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days}d`;
    }
  };

  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public";

  return (
    <div className="relative w-full overflow-hidden lg:w-auto">
      <div className="absolute right-2 top-2 z-10 mr-2 mt-2">
        {isCurrentUserAuthor && (
          <div className="flex items-center space-x-2">
            <button onClick={handleEditClick} className="text-gray-300 hover:text-white">
              <PencilIcon className="h-5 w-5" />
            </button>
            <button onClick={handleDelete} className="text-gray-300 hover:text-white">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-1 p-4">
        <div className="flex flex-row">
          <div>
            {authorProfilePicture ? (
              <img
                src={`${supabaseStorageBaseUrl}/${authorProfilePicture}`}
                alt={`${authorFirstName}'s profile`}
                className="mt-1 h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon
                className="mt-1 h-10 w-10 text-[#525252]"
                aria-hidden="true"
              />
            )}
          </div>
          <div>
            <div className="ml-2">
              <p className="text-white">
                {authorFirstName}
                {""} {authorLastName}
                <span className="ml-1 text-xs text-gray-600">
                  • {calculateTimeElapsed()}
                </span>
              </p>
            </div>
            <div className="ml-2 mt-1 text-sm text-white">
              <p className="mb-3">{content}</p>
              {postphoto && (
                <img
                  src={`${supabaseStorageBaseUrl}/${postphoto}`}
                  alt="Post Image"
                  className="mb-4 w-full rounded-lg border border-[#525252]"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mb-4 ml-16 flex flex-row">
        <button
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="flex items-center focus:outline-none"
        >
          <ChatBubbleOvalLeftIcon
            className={`mr-1 h-4 w-4 ${accordionOpen ? "text-primary" : "text-gray-500"}`}
          />
          <span
            className={`mt-1 text-xs ${accordionOpen ? "text-primary" : "text-gray-500"}`}
          >
            Comment
          </span>
        </button>
      </div>
      <Transition
        show={accordionOpen}
        as={Fragment}
        enter="transition ease-out duration-300"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div>
          {accordionOpen && (
            <div className="transition-all duration-300">
              <Comment
                postid={postid}
                authorid={authorid}
                // addComment={addComment}
                // comments={comments} // Pass comments array to Comment component
              />
            </div>
          )}
        </div>
      </Transition>
      {showEditModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-[#1C1C1C] text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Edit Post
                    </h3>
                    <div className="mt-2">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={4}
                        className="mb-4 block w-full resize-none rounded-lg border-2 border-gray-300 bg-none p-2"
                      />
                      {isImageVisible && postphoto && (
                        <div className="relative mb-4">
                          <img
                            src={`${supabaseStorageBaseUrl}/${postphoto}`}
                            alt="Post Image"
                            className="w-full rounded-lg"
                          />
                          <button
                            onClick={handleRemoveImage}
                            className="hover :text-red-700 absolute right-0 top-0 mr-1 mt-1 text-xs text-red-500 focus:outline-none"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditedPhoto(e.target.files?.[0] || null)}
                        className="mb-2"
                      />
                      <select
                        value={editedPrivacyLevel}
                        onChange={(e) => setEditedPrivacyLevel(e.target.value)}
                        className="mb-4 w-24 rounded-lg border-2 border-gray-300 p-2"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                      {validationError && (
                        <p className="mb-4 text-sm text-red-500">{validationError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={isLoading}
                >
                  Save
                </button>
                <button
                  onClick={handleCloseEditModal}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block transform overflow-hidden rounded-lg bg-[#1C1C1C] text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Delete Post
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this post?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  onClick={confirmDelete}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostsCard;
