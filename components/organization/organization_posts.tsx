import { useEffect, useState, useRef } from "react";
import PostsCard from "./posts_card";
import PostsTextArea from "./posts_textarea";
import { fetchPosts } from "@/lib/posts";
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import Divider from "./divider";
import { createClient } from "@/lib/supabase/client";

const OrganizationPostsComponent = ({ organizationid, posts }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [postsData, setPostsData] = useState(posts);
  const [editingPost, setEditingPost] = useState(null);
  const postsTextAreaRef = useRef(null); // Create a ref for the PostsTextArea

  const postsPerPage = 3;

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await fetchPosts(organizationid, currentPage, postsPerPage);
      if (!error) {
        setPostsData(data);
      } else {
        console.error("Error fetching posts:", error);
      }
    };
    fetchData();
  }, [organizationid, currentPage]);

  useEffect(() => {
    if (editingPost && postsTextAreaRef.current) {
      const element = postsTextAreaRef.current;
      const offset = element.getBoundingClientRect().top + window.pageYOffset - (window.innerHeight / 2) + (element.clientHeight / 2);
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [editingPost]);

  useEffect(() => {
    const supabase = createClient();
    supabase.channel('posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async (payload) => {
          const { data, error } = await fetchPosts(organizationid, currentPage, postsPerPage);
          if (!error) {
            setPostsData(data);
          } else {
            console.error("Error fetching posts:", error);
          }
        }
      )
      .subscribe();

  }, [organizationid, currentPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const isFirstPage = currentPage === 1;
  const isLastPage = postsData.length < postsPerPage;

  const startEdit = (post) => {
    setEditingPost(post);
  };

  const cancelEdit = () => {
    setEditingPost(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col justify-center">
        <h2 className="mb-8 text-center text-2xl font-semibold text-light">
          Organization Posts
        </h2>
        <div ref={postsTextAreaRef}> {/* Add ref to the PostsTextArea container */}
          <PostsTextArea
            organizationid={organizationid}
            postsData={postsData}
            setPostsData={setPostsData}
            editingPost={editingPost}
            cancelEdit={cancelEdit}
            setEditingPost={setEditingPost} // Pass the setEditingPost function
          />
        </div>
        <div className="isolate max-w-6xl lg:max-w-none">
          {postsData.map((post, index) => (
            <div key={index} className="mx-auto">
              <PostsCard
                post={post}
                setPostsData={setPostsData}
                postsData={postsData}
                startEdit={startEdit}
              />
              {index !== postsData.length - 1 && <Divider />}
            </div>
          ))}
        </div>{" "}
        {/* Pagination */}
        <div className="mt-2 w-full">
          <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
            <div className="-mt-px flex w-0 flex-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={isFirstPage}
                className={`inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium ${
                  isFirstPage
                    ? "cursor-not-allowed text-gray-500"
                    : "text-light hover:border-primary hover:text-primary"
                }`}
              >
                <ArrowLongLeftIcon
                  className="mr-3 h-5 w-5 text-light"
                  aria-hidden="true"
                />
                Previous
              </button>
            </div>
            <div className="hidden md:-mt-px md:flex">
              {Array.from({ length: Math.ceil(posts.length / postsPerPage) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium ${
                    currentPage === i + 1
                      ? "border-primarydark text-primary"
                      : "text-light hover:border-primary hover:text-primary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="-mt-px flex w-0 flex-1 justify-end">
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={isLastPage}
                className={`inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium ${
                  isLastPage
                    ? "cursor-not-allowed text-gray-500"
                    : "text-light hover:border-primary hover:text-primary"
                }`}
              >
                Next
                <ArrowLongRightIcon
                  className="ml-3 h-5 w-5 text-light"
                  aria-hidden="true"
                />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPostsComponent;
