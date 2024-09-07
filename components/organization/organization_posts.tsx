import Preloader from "@/components/preloader";
import { check_permissions, getUserOrganizationInfo } from "@/lib/organization";
import { fetchPosts } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, useCallback } from "react";
import Divider from "./divider";
import PostsCard from "./posts_card";
import PostsTextArea from "./posts_textarea";
import { Posts } from "@/types/posts";
import { useUser } from "@/context/user_context";

const OrganizationPostsComponent = ({ organizationid }: { organizationid: string }) => {
  const [postsData, setPostsData] = useState<Posts[]>([]);
  const [editingPost, setEditingPost] = useState<Posts | null>(null);
  const [isMemberOfOrganization, setIsMemberOfOrganization] = useState(false);
  const [permissions, setPermissions] = useState<{ create_posts?: boolean; edit_posts?: boolean; delete_posts?: boolean; comment_on_posts?: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;
  const [loading, setLoading] = useState(true);
  const postsTextAreaRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();
  const { user } = useUser();

  const fetchData = useCallback(async (userId: string | null) => {
    if (organizationid && userId) {
      const { data, error } = await fetchPosts(organizationid, userId);
      if (!error) {
        setPostsData(data);
      } else {
        console.error("Error fetching posts:", error);
      }
    }
    setLoading(false);
  }, [organizationid]);

  useEffect(() => {
    const loadData = async () => {
      if (user && user.id) {
        const userId = user.id ?? "";
        const userOrgInfo = await getUserOrganizationInfo(userId, organizationid);
        const isMember = !!userOrgInfo;
        setIsMemberOfOrganization(isMember);
        fetchData(userId);

        const permissionsArr = ["create_posts", "edit_posts", "delete_posts", "comment_on_posts"];
        const perms = await Promise.all(
          permissionsArr.map(key => check_permissions(userId, organizationid, key))
        );
        setPermissions(perms.reduce((acc, perm, i) => ({ ...acc, [permissionsArr[i]]: perm }), {}));
      } else {
        fetchData(null);
      }
    };

    loadData();
    const channel = supabase
      .channel("posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        if (user && user.id) {
          fetchData(user.id ?? "");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationid, fetchData, supabase, user]);

  useEffect(() => {
    if (editingPost && postsTextAreaRef.current) {
      const element = postsTextAreaRef.current;
      const offset =
        element.getBoundingClientRect().top + window.pageYOffset - window.innerHeight / 2 + element.clientHeight / 2;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [editingPost]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const currentPosts = postsData.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <div className="mx-auto max-w-4xl">
      {loading ? (
        <Preloader />
      ) : (
        <div className="flex flex-col justify-center">
          <h2 className="mb-8 text-center text-2xl font-semibold text-light">Organization Posts</h2>
          {permissions.create_posts && (
            <div ref={postsTextAreaRef}>
              <PostsTextArea
                organizationid={organizationid}
                postsData={postsData}
                setPostsData={setPostsData}
                editingPost={editingPost}
                cancelEdit={() => setEditingPost(null)}
                setEditingPost={setEditingPost}
              />
            </div>
          )}
          <div className="isolate max-w-6xl lg:max-w-none">
            {currentPosts.length ? (
              currentPosts.map((post: Posts, index) => (
                <div key={post.postid} className="mx-auto">
                  <PostsCard
                    post={post}
                    setPostsData={setPostsData}
                    postsData={postsData}
                    startEdit={setEditingPost}
                    canEdit={permissions.edit_posts ?? false}
                    canDelete={permissions.delete_posts ?? false}
                    canComment={permissions.comment_on_posts ?? false}
                  />
                  {index !== currentPosts.length - 1 && <Divider />}
                </div>
              ))
            ) : (
              <div className="mb-4 mt-5 rounded-lg bg-gray-800 p-4 text-sm text-blue-400" role="alert">
                The organization has no posts available for you.
              </div>
            )}
          </div>
          <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center border-t-2 pr-1 pt-4 text-sm ${
                currentPage === 1 ? "cursor-not-allowed text-gray-500" : "hover:border-primary hover:text-primary"
              }`}
            >
              <ArrowLeftIcon className="mr-3 h-5 w-5" aria-hidden="true" />
              Previous
            </button>
            <div className="hidden md:-mt-px md:flex">
              {Array.from({ length: Math.ceil(postsData.length / postsPerPage) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm ${
                    currentPage === i + 1 ? "border-primarydark text-primary" : "hover:border-primary hover:text-primary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(postsData.length / postsPerPage)}
              className={`inline-flex items-center border-t-2 pl-1 pt-4 text-sm ${
                currentPage === Math.ceil(postsData.length / postsPerPage)
                  ? "cursor-not-allowed text-gray-500"
                  : "hover:border-primary hover:text-primary"
              }`}
            >
              Next
              <ArrowRightIcon className="ml-3 h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default OrganizationPostsComponent;
