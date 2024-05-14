import { fetchPosts } from "@/lib/posts"; // Import your fetchPosts function from your Supabase API file
import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import Posts from "../app/posts";
import PostsCard from "./posts_card";
import PostsTextArea from "./posts_textarea";

const OrganizationPostsComponent = ({ organizationid }) => {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await fetchPosts(organizationid, currentPage, postsPerPage);
      if (!error) {
        setPosts(data);
      } else {
        console.error("Error fetching posts:", error);
      }
    };
    fetchData();
  }, [organizationid, currentPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const isFirstPage = currentPage === 1;
  const isLastPage = posts.length < postsPerPage;

  return (
    <div className="">
      <div className="flex flex-col">
        <h2 className="text-2xl font-semibold text-light">Organization Posts</h2>
        <PostsTextArea />

        <div className="isolate mx-auto mt-8 max-w-6xl sm:mt-12 lg:mx-0 lg:max-w-none">
          {posts.map((post, index) => (
            <div key={index} className="mx-auto mb-4 ">
              <PostsCard post={post} />
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div className="mt-4 w-full">
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
