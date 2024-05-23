import { PencilIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { updatePost, deletePost, getAuthorDetails } from "@/lib/posts";
import { getUser, createClient } from "@/lib/supabase/client";
import Comments from "./comments";
import { fetchComments } from "@/lib/comments";

const PostsCard = ({ post, postsData, setPostsData, startEdit }) => {
  const {
    content,
    createdat,
    postphotos,
    authorid,
    postid,
    privacylevel,
    organizationid,
  } = post;
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
    isMemberOfOrganization: false,
  });

  const supabase = createClient();

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

  const checkIsMemberOfOrganization = async () => {
    const currentUser = await getUser();
    if (currentUser) {
      const { data, error } = await supabase
        .from("organizationmembers")
        .select("*")
        .eq("userid", currentUser.user.id)
        .eq("organizationid", organizationid);
      if (!error && data.length > 0) {
        handleInputChange("isMemberOfOrganization", true);
      }
    }
  };

  const loadComments = async () => {
    const { data, error } = await fetchComments(postid);
    if (!error) {
      const convertedData = data
        .map((comment) => {
          const philippineTime = new Date(comment.created_at).toLocaleString("en-US", {
            timeZone: "Asia/Manila",
          });
          return { ...comment, created_at: philippineTime };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      handleInputChange("comments", convertedData);
    }
  };

  useEffect(() => {
    handleAuthorDetails();
    checkIsCurrentUserAuthor();
    checkIsMemberOfOrganization();
    loadComments();

    const commentsChannel = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      commentsChannel.unsubscribe();
    };
  }, [authorid, postid, organizationid]);

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
    postTime.setHours(postTime.getHours() + 8);
    const elapsedTime = currentTime - postTime;
    console.log(elapsedTime);
    const minutes = Math.floor(elapsedTime / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  if (
    privacylevel === "private" &&
    !state.isMemberOfOrganization &&
    !state.isCurrentUserAuthor
  ) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div className="mt-2 p-4">
        <div className="flex flex-row">
          <div>
            <div className="mt-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#424242]">
              {state.authorDetails.profilePicture ? (
                <img
                  src={`${supabaseStorageBaseUrl}/${state.authorDetails.profilePicture}`}
                  alt={`${state.authorDetails.firstName}'s profile`}
                  className="h-full max-h-full w-full max-w-full rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-white" />
              )}
            </div>
          </div>
          <div className="ml-2 flex-1">
            <p className="flex items-center text-white">
              {state.authorDetails.firstName} {state.authorDetails.lastName}
              <span className="ml-1 text-xs text-gray-400">
                • {calculateTimeElapsed()} •{" "}
                {privacylevel.charAt(0).toUpperCase() + privacylevel.slice(1)}
              </span>
              {state.isCurrentUserAuthor && (
                <div className="ml-auto flex items-center">
                  <button onClick={() => startEdit(post)} className="text-gray-400">
                    <PencilIcon className="h-5 w-5 text-white" />
                  </button>
                  <button onClick={handleDelete} className="ml-2 text-gray-400">
                    <TrashIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              )}
            </p>
            <div className="mt-2 text-sm text-white">
              <p className="mb-3">{content}</p>
              {postphotos && postphotos.length > 0 && (
                <Carousel
                  showArrows={true}
                  dynamicHeight={true}
                  swipeable={true}
                  showThumbs={false}
                >
                  {postphotos.map((photo, index) => (
                    <div key={index}>
                      <img
                        src={`${supabaseStorageBaseUrl}/post-images/${photo}`}
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
          <span className="mt-1 text-xs">
            {state.accordionOpen ? "Hide Comments" : "Show Comments"}
          </span>
        </button>
      </div>
      {state.accordionOpen && (
        <div>
          <Comments postid={postid} />
        </div>
      )}

      {state.showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-75">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg bg-[#3b3b3b] p-6">
              <h3 className="text-white">Delete Post</h3>
              <p className="mb-4 mt-2 text-white">
                Are you sure you want to delete this post?
              </p>
              <div className="flex justify-end">
                <button
                  onClick={confirmDelete}
                  className="mr-2 rounded bg-red-600 px-4 py-2 text-white"
                  disabled={state.isLoading}
                >
                  {state.isLoading ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={cancelDelete}
                  className="rounded bg-white px-4 py-2 text-black"
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
