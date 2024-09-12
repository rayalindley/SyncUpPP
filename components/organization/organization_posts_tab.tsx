import Preloader from "@/components/preloader";
import { check_permissions, getUserOrganizationInfo } from "@/lib/organization";
import { fetchPosts } from "@/lib/groups/posts_tab";
import { getMemberships } from "@/lib/memberships";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, useCallback } from "react";
import Divider from "./divider";
import PostsCard from "./posts_card";
import PostsTextArea from "./posts_textarea";
import { Posts } from "@/types/posts";
import { useUser } from "@/context/user_context";

const OrganizationPostsTab = ({ organizationid }: { organizationid: string }) => {
  const [postsData, setPostsData] = useState<Posts[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Posts[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPost, setEditingPost] = useState<Posts | null>(null);
  const [permissions, setPermissions] = useState<{
    create_posts?: boolean;
    edit_posts?: boolean;
    delete_posts?: boolean;
    comment_on_posts?: boolean;
  }>({});
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);
  const [availableMemberships, setAvailableMemberships] = useState<{ membershipid: string; name: string }[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const postsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const postsTextAreaRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();
  const { user } = useUser();

  const fetchData = useCallback(
    async (userId: string | null) => {
      try {
        if (organizationid && userId) {
          const { data, error } = await fetchPosts(organizationid, userId);
          if (!error) {
            setPostsData(data);
            setFilteredPosts(data);
          } else {
            console.error("Error fetching posts:", error);
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    },
    [organizationid]
  );

  const fetchPermissions = useCallback(async () => {
    if (user?.id) {
      try {
        const [create, edit, deletePerm, comment] = await Promise.all([
          check_permissions(user.id, organizationid, "create_posts"),
          check_permissions(user.id, organizationid, "edit_posts"),
          check_permissions(user.id, organizationid, "delete_posts"),
          check_permissions(user.id, organizationid, "comment_on_posts"),
        ]);

        setPermissions({
          create_posts: create,
          edit_posts: edit,
          delete_posts: deletePerm,
          comment_on_posts: comment,
        });
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    }
  }, [user?.id, organizationid]);

  const fetchAvailableRoles = useCallback(async () => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("organization_roles")
        .select("role_id, role")
        .eq("org_id", organizationid);

      if (!roleError && roleData) {
        const roles = roleData.map((row: { role_id: string; role: string }) => ({
          id: row.role_id,
          name: row.role,
        }));
        setAvailableRoles(roles);
      } else {
        console.error("Error fetching roles:", roleError);
      }
    } catch (error) {
      console.error("Error in fetchAvailableRoles:", error);
    }
  }, [organizationid, supabase]);

  const fetchAvailableMemberships = useCallback(async () => {
    try {
      const memberships = await getMemberships(organizationid);
      setAvailableMemberships(memberships);
    } catch (error) {
      console.error("Error in fetchAvailableMemberships:", error);
    }
  }, [organizationid]);

  const applyFilter = useCallback(() => {
    let filtered = postsData;

    if (filter === "Public") {
      filtered = postsData.filter(
        (post) => post.privacylevel?.length === 0 && !post.targetmembershipid
      );
    } else if (filter !== "All") {
      filtered = postsData.filter(
        (post) => Array.isArray(post.privacylevel) && post.privacylevel.includes(filter)
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((post) =>
        post.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  }, [filter, searchQuery, postsData]);

  useEffect(() => {
    const loadData = async () => {
      if (user && user.id) {
        const userId = user.id ?? "";
        await fetchAvailableRoles();
        await fetchAvailableMemberships();
        await fetchData(userId);
        await fetchPermissions();
      }
    };
    loadData();
  }, [user, fetchData, fetchAvailableRoles, fetchAvailableMemberships, fetchPermissions]);

  useEffect(() => {
    applyFilter();
  }, [filter, searchQuery, postsData, applyFilter]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleStartEdit = (post: Posts) => {
    setEditingPost(post);
    if (postsTextAreaRef.current) {
      postsTextAreaRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {loading ? (
        <Preloader />
      ) : (
        <div className="flex flex-col justify-center">
          <h2 className="mb-8 text-center text-2xl font-semibold text-light">
            Organization Posts
          </h2>

          <div className="mb-4 flex justify-between">
            <label htmlFor="filter-select" className="sr-only">Filter Posts</label>
            <select
              id="filter-select"
              className="rounded-md border bg-[#1e1e1e] p-2 text-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Public">Public</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
              {availableMemberships.map((membership) => (
                <option key={membership.membershipid} value={membership.membershipid}>
                  {membership.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="rounded-md border bg-[#1e1e1e] p-2 text-white"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div ref={postsTextAreaRef}>
            {permissions.create_posts ? (
              <PostsTextArea
                organizationid={organizationid}
                postsData={postsData}
                setPostsData={setPostsData}
                editingPost={editingPost}
                cancelEdit={() => setEditingPost(null)}
                setEditingPost={setEditingPost}
                availableRoles={availableRoles}
                availableMemberships={availableMemberships}
              />
            ) : (
              <p className="text-red-500">You do not have permission to create posts.</p>
            )}
          </div>

          <div className="isolate max-w-6xl lg:max-w-none">
            {filteredPosts.length ? (
              filteredPosts.map((post, index) => (
                <div key={post.postid} className="mx-auto">
                  <PostsCard
                    post={post}
                    setPostsData={setPostsData}
                    postsData={postsData}
                    startEdit={handleStartEdit}
                    canEdit={permissions.edit_posts ?? false}
                    canDelete={permissions.delete_posts ?? false}
                    canComment={permissions.comment_on_posts ?? false}
                  />
                  {index !== filteredPosts.length - 1 && <Divider />}
                </div>
              ))
            ) : (
              <div
                className="mb-4 mt-5 rounded-lg bg-gray-800 p-4 text-sm text-blue-400"
                role="alert"
              >
                No posts found matching your criteria.
              </div>
            )}
          </div>

          <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center border-t-2 pr-1 pt-4 text-sm ${
                currentPage === 1
                  ? "cursor-not-allowed text-gray-500"
                  : "hover:border-primary hover:text-primary"
              }`}
            >
              <ArrowLeftIcon className="mr-3 h-5 w-5" aria-hidden="true" />
              Previous
            </button>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredPosts.length / postsPerPage)}
              className={`inline-flex items-center border-t-2 pl-1 pt-4 text-sm ${
                currentPage === Math.ceil(filteredPosts.length / postsPerPage)
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

export default OrganizationPostsTab;
