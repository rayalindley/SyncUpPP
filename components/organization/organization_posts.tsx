import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import PostsCard from "./posts_card";

const OrganizationPostsComponent = () => {
  const posts = [
    {
      imageUrl: "https://www.idoinspire.com/hubfs/FPH_9736.jpg#keepProtocol", // Replace with actual image URL
      title: "Post 1",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      title: "Post 2",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      title: "Post 3",
      description: "Description for Post 3 without image",
    },
    {
      imageUrl: "https://via.placeholder.com/300", // Replace with actual image URL
      title: "Post 4",
      description: "Description for Post 4",
    },
    {
      title: "Post 5",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    // Add more posts as needed
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;
  const totalPosts = posts.length;

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-semibold text-light">Organization Posts</h2>
      <div className="mt-4 w-6/12">
        {currentPosts.map((post, index) => (
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
              disabled={currentPage === 1}
              className={`inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium ${
                currentPage === 1
                  ? "cursor-not-allowed text-gray-500"
                  : "text-light hover:border-primary hover:text-primary"
              }`}
            >
              <ArrowLongLeftIcon className="mr-3 h-5 w-5 text-light" aria-hidden="true" />
              Previous
            </button>
          </div>
          <div className="hidden md:-mt-px md:flex">
            {Array.from({ length: Math.ceil(totalPosts / postsPerPage) }, (_, i) => (
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
              disabled={currentPage === Math.ceil(totalPosts / postsPerPage)}
              className={`inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium ${
                currentPage === Math.ceil(totalPosts / postsPerPage)
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
  );
};

export default OrganizationPostsComponent;
