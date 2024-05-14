"use client";
import React, { useState, useEffect } from "react";
import { insertPost, fetchPosts, updatePost } from "@/lib/posts"; // Adjust the import path as needed
import { z } from "zod";

// Define schema using Zod for form validation
const postSchema = z.object({
  content: z.string(),
  privacyLevel: z.enum(["public", "private"]),
});

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedPost, setEditedPost] = useState({
    postid: "",
    content: "",
    privacyLevel: "public",
  });

  useEffect(() => {
    // Fetch posts on component mount
    const organizationId = "893a84eb-a450-45c2-87ca-08a979355592"; // Set your organizationId here
    const currentPage = 1; // Set the initial page
    const postsPerPage = 10; // Set the number of posts per page
    fetchPosts(organizationId, currentPage, postsPerPage)
      .then((result) => {
        if (!result.error) {
          setPosts(result.data);
        } else {
          console.error("Error fetching posts:", result.error.message);
        }
      })
      .catch((error) => {
        console.error("Unexpected error:", error);
      });
  }, []);

  const toggleAddModal = () => {
    setShowAddModal(!showAddModal);
  };

  const toggleEditModal = () => {
    setShowEditModal(!showEditModal);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedPost({ ...editedPost, [name]: value });
  };

  const handleAddPost = async () => {
    try {
      const validationResult = postSchema.safeParse(editedPost);
      if (!validationResult.success) {
        alert("Please fill in all fields.");
        return;
      }

      const currentTime = getCurrentTime(); // Assuming getCurrentTime function is defined
      const organizationId = "893a84eb-a450-45c2-87ca-08a979355592"; // Set your organizationId here

      const { data, error } = await insertPost(
        {
          ...editedPost,
          createdat: currentTime,
          organizationId,
        },
        organizationId
      );

      if (!error) {
        setPosts([...posts, data[0]]);
        toggleAddModal();
      } else {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error adding post:", error);
      alert("Failed to add post. Please try again later.");
    }
  };

  const handleUpdatePost = async () => {
    try {
      const { data, error } = await updatePost(editedPost);

      if (!error) {
        // Update the post in the local state
        const updatedPosts = posts.map(
          (post) =>
            post.id === editedPost.postid
              ? { ...post, content: editedPost.content }
              : post
          // Change 'post.id' to 'post.postid' here
        );
        setPosts(updatedPosts);
        toggleEditModal();
      } else {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post. Please try again later.");
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const formattedDate = now.toISOString();
    return formattedDate;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <button
          className="rounded-lg bg-blue-500 px-4 py-2 text-white"
          onClick={toggleAddModal}
        >
          Add Post
        </button>
      </div>
      <div className="mt-4 flex w-full justify-center">
        <div className="w-1/3">
          {posts.map((post) => (
            <div key={post.id} className="border-6xl relative mb-4 border p-4">
              <button
                className="absolute right-0 top-0 m-2 rounded-full bg-blue-500 px-2 py-1 text-white"
                onClick={() => {
                  setEditedPost({ ...post });
                  toggleEditModal();
                }}
              >
                Edit Post
              </button>
              <p className="mt-1 text-gray-600">Time: {post.time}</p>
              <p className="mt-2">{post.content}</p>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="w-1/3 bg-white p-8">
            <h2 className="mb-4 text-2xl font-semibold">Add Post</h2>
            <div className="flex flex-col space-y-4">
              <label className="text-lg">Content:</label>
              <textarea
                name="content"
                value={editedPost.content}
                onChange={handleInputChange}
                className="h-20 rounded-lg border border-gray-300 px-3 py-2"
              />

              <label className="text-lg">Privacy Level:</label>
              <select
                name="privacyLevel"
                value={editedPost.privacyLevel}
                onChange={handleInputChange}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="rounded-lg bg-blue-500 px-4 py-2 text-white"
                onClick={handleAddPost}
              >
                Add Post
              </button>
              <button
                className="ml-2 rounded-lg bg-gray-300 px-4 py-2 text-gray-800"
                onClick={toggleAddModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="w-1/3 bg-white p-8">
            <h2 className="mb-4 text-2xl font-semibold">Edit Post</h2>
            <div className="flex flex-col space-y-4">
              <label className="text-lg">Content:</label>
              <textarea
                name="content"
                value={editedPost.content}
                onChange={handleInputChange}
                className="h-20 rounded-lg border border-gray-300 px-3 py-2"
              />

              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white"
                  onClick={handleUpdatePost}
                >
                  Update Post
                </button>
                <button
                  className="ml-2 rounded-lg bg-gray-300 px-4 py-2 text-gray-800"
                  onClick={toggleEditModal}
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
}
