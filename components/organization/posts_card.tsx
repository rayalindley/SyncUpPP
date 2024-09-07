import React, { useState, useEffect, useCallback, memo } from "react";
import { PencilIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { deletePost, getAuthorDetails } from "@/lib/posts";
import { getUser } from "@/lib/supabase/client";
import Comments from "./comments";
import { fetchComments } from "@/lib/comments";
import { Posts } from "@/types/posts";
import { createClient } from "@/lib/supabase/client";

interface PostsCardProps {
  post: Posts;
  postsData: Posts[];
  setPostsData: React.Dispatch<React.SetStateAction<Posts[]>>;
  startEdit: (post: Posts) => void;
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
}

interface AuthorDetails {
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

interface CommentData {
  commentid: string;
  created_at: string;
  authorid: string;
  comment: string;
}

const PostsCard: React.FC<PostsCardProps> = ({
  post,
  postsData,
  setPostsData,
  startEdit,
  canEdit,
  canDelete,
  canComment,
}) => {
  const {
    content,
    createdat,
    postphotos,
    authorid,
    postid,
    privacylevel,
    organizationid,
  } = post;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [authorDetails, setAuthorDetails] = useState<AuthorDetails>({
    firstName: "",
    lastName: "",
    profilePicture: null,
  });
  const [isCurrentUserAuthor, setIsCurrentUserAuthor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roleNames, setRoleNames] = useState<string[]>([]);

  const handleAuthorDetails = useCallback(async () => {
    const { first_name, last_name, profilepicture } = await getAuthorDetails(authorid);
    setAuthorDetails({
      firstName: first_name,
      lastName: last_name,
      profilePicture: profilepicture,
    });
  }, [authorid]);

  const checkPermissions = useCallback(async () => {
    const currentUser = await getUser();
    setIsCurrentUserAuthor(currentUser?.user?.id === authorid);
  }, [authorid]);

  const loadComments = useCallback(async () => {
    const { data, error } = await fetchComments(postid);
    if (!error) {
      const convertedData = data
        .map((comment: CommentData) => ({
          ...comment,
          created_at: new Date(comment.created_at).toLocaleString("en-US", {
            timeZone: "Asia/Manila", // Set to Philippine Standard Time
          }),
        }))
        .sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      setComments(convertedData);
    }
  }, [postid]);

  const fetchRoleNames = useCallback(async () => {
    const supabase = createClient();
    if (Array.isArray(privacylevel) && privacylevel.length > 0) {
      const { data, error } = await supabase
        .from("organization_roles")
        .select("role")
        .in("role_id", privacylevel); // privacylevel is now an array

      if (!error && data) {
        const names = data.map((role: { role: string }) => role.role);
        setRoleNames(names);
      }
    }
  }, [privacylevel]);

  useEffect(() => {
    handleAuthorDetails();
    checkPermissions();
    loadComments();
    fetchRoleNames(); // Fetch role names
  }, [handleAuthorDetails, checkPermissions, loadComments, fetchRoleNames]);

  const handleDelete = () => setShowDeleteModal(true);

  const confirmDelete = async () => {
    setIsLoading(true);
    const { error } = await deletePost(postid, authorid);
    if (!error) {
      setPostsData((prevPosts) => prevPosts.filter((p) => p.postid !== postid));
      setShowDeleteModal(false);
    } else {
      console.error("Error deleting post:", error);
    }
    setIsLoading(false);
  };

  const calculateTimeElapsed = () => {
    const currentTime = new Date();
    const postTime = createdat ? new Date(createdat) : new Date();
    const elapsedTime = currentTime.getTime() - postTime.getTime();
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
            <div className="mt-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#424242]">
              {authorDetails.profilePicture ? (
                <img
                  src={`${supabaseStorageBaseUrl}/${authorDetails.profilePicture}`}
                  alt={`${authorDetails.firstName}'s profile`}
                  className="h-full max-h-full w-full max-w-full rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-white" />
              )}
            </div>
          </div>
          <div className="ml-2 flex-1">
            <p className="flex items-center text-white">
              {authorDetails.firstName} {authorDetails.lastName}
              <div className="ml-auto flex flex-col md:flex-row md:items-center">
                <span className="text-xs text-gray-400">
                  {calculateTimeElapsed()} •{" "}
                </span>
                <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-0">
                  {roleNames.length > 0 ? (
                    roleNames.map((role, index) => (
                      <span
                        key={index}
                        className="inline-block rounded-full bg-blue-600 px-2 py-1 text-xs text-white"
                      >
                        #{role}
                      </span>
                    ))
                  ) : (
                    <span>Unknown</span>
                  )}
                </div>
              </div>
            </p>
            <div className="mt-2 text-sm text-white">
              <p className="mb-3">{content}</p>
              {Array.isArray(postphotos) && postphotos.length > 0 && (
                <Carousel showArrows={true} dynamicHeight={true} swipeable={true} showThumbs={false}>
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
          onClick={() => setAccordionOpen(!accordionOpen)}
          className={`flex items-center outline-none ${accordionOpen ? "text-primary" : "text-gray-400"}`}
        >
          <span className="mt-1 text-xs">
            {accordionOpen ? "Hide Comments" : "Show Comments"}
          </span>
        </button>
      </div>
      {accordionOpen && <Comments postid={postid} canComment={canComment} />}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-75">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg bg-[#3b3b3b] p-6">
              <h3 className="text-white">Delete Post</h3>
              <p className="mb-4 mt-2 text-white">Are you sure you want to delete this post?</p>
              <div className="flex justify-end">
                <button
                  onClick={confirmDelete}
                  className="mr-2 rounded bg-red-600 px-4 py-2 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
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

export default memo(PostsCard);
