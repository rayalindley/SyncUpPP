import { PencilIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { updatePost, deletePost, getAuthorDetails } from "@/lib/posts";
import { getUser, createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import Comments from "./comments";
import { fetchComments } from "@/lib/comments";

const PostsCard = ({ post, postsData, setPostsData, startEdit }) => {
  const { content, createdat, postphotos, authorid, postid, privacylevel } = post;
  const [state, setState] = useState({
    showDeleteModal: false,
    isImageVisible: true,
    comments: [],
    accordionOpen: false,
    authorDetails: {
      firstName: "",
      lastName: "",
      profilePicture: null,
    },
    isCurrentUserAuthor: false,
    isLoading: false,
  });

  const handleInputChange = (key, value) => {
    setState((prevState) => ({ ...prevState, [key]: value }));
  };

  const handleAuthorDetails = async () => {
    const { first_name, last_name, profilepicture } = await getAuthorDetails(authorid);
    handleInputChange("authorDetails", {
      firstName: first_name,
      lastName: last_name,
      profilePicture: profilepicture,
    });
  };

  const checkIsCurrentUserAuthor = async () => {
    const currentUser = await getUser();
    handleInputChange("isCurrentUserAuthor", currentUser?.user?.id === authorid);
  };

  const loadComments = async () => {
    const { data, error } = await fetchComments(postid);
    if (!error) {
      handleInputChange("comments", data);
    }
  };

  useEffect(() => {
    handleAuthorDetails();
    checkIsCurrentUserAuthor();
    loadComments();
  }, [authorid, postid]);

  const handleDelete = async () => {
    handleInputChange("showDeleteModal", true);
  };

  const confirmDelete = async () => {
    handleInputChange("isLoading", true);
    const { error } = await deletePost(postid, authorid);

    if (!error) {
      const updatedPosts = postsData.filter((p) => p.postid !== postid);
      setPostsData(updatedPosts);
      handleInputChange("showDeleteModal", false);
    } else {
      console.error("Error deleting post:", error);
    }
    handleInputChange("isLoading", false);
  };

  const cancelDelete = () => {
    handleInputChange("showDeleteModal", false);
  };

  const calculateTimeElapsed = () => {
    const currentTime = new Date();
    const postTime = new Date(createdat);
    const elapsedTime = currentTime - postTime;
    const minutes = Math.floor(elapsedTime / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  return (
    <div className="relative w-full overflow-hidden">
      <div className="mt-2 p-4">
        <div className="flex flex-row">
          <div>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#424242] flex justify-center items-center mt-2">
              {state.authorDetails.profilePicture ? (
                <img
                  src={`${supabaseStorageBaseUrl}/${state.authorDetails.profilePicture}`}
                  alt={`${state.authorDetails.firstName}'s profile`}
                  className="max-w-full max-h-full rounded-full object-cover w-full h-full"
                />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-white" />
              )}
            </div>
          </div>
          <div className="flex-1 ml-2">
            <p className="text-white flex items-center">
              {state.authorDetails.firstName} {state.authorDetails.lastName}
              <span className="ml-1 text-xs text-gray-400">
                • {calculateTimeElapsed()} • {privacylevel.charAt(0).toUpperCase() + privacylevel.slice(1)}
              </span>
              {state.isCurrentUserAuthor && (
                <div className="flex items-center ml-auto">
                  <button onClick={() => startEdit(post)} className="text-gray-400">
                    <PencilIcon className="h-5 w-5 text-white" />
                  </button>
                  <button onClick={handleDelete} className="text-gray-400 ml-2">
                    <TrashIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              )}
            </p>
            <div className="mt-2 text-sm text-white">
              <p className="mb-3">{content}</p>
              {postphotos && postphotos.length > 0 && (
                <Carousel showArrows={true} dynamicHeight={true}>
                  {postphotos.map((photo, index) => (
                    <div key={index}>
                      <img
                        src={`${supabaseStorageBaseUrl}/${photo}`}
                        alt={`Post Image ${index + 1}`}
                        className="w-full rounded-lg border border-gray-700"
                      />
                    </div>
                  ))}
                </Carousel>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mb-4 ml-16 flex flex-row">
        <button
          onClick={() => handleInputChange("accordionOpen", !state.accordionOpen)}
          className={`flex items-center outline-none ${state.accordionOpen ? "text-primary" : "text-gray-400"}`}
        >
          <span className="mt-1 text-xs">{state.accordionOpen ? "Hide Comments" : "Show Comments"}</span>
        </button>
      </div>
      {state.accordionOpen && (
        <div>
          <Comments postid={postid} />
        </div>
      )}

      {state.showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-75">
          <div className="flex min-h-screen justify-center items-center p-4">
            <div className="bg-[#3b3b3b] p-6 rounded-lg max-w-lg w-full">
              <h3 className="text-white">Delete Post</h3>
              <p className="text-white mt-2 mb-4">
                Are you sure you want to delete this post?
              </p>
              <div className="flex justify-end">
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded bg-red-600 text-white mr-2"
                  disabled={state.isLoading}
                >
                  {state.isLoading ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 rounded bg-white text-black"
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
