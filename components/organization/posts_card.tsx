import { getAuthorFirstName } from "@/lib/posts";
import { useEffect, useState } from "react";

const PostsCard = ({ post }) => {
  const { content, createdat, postphoto, authorid } = post;
  const [authorFirstName, setAuthorFirstName] = useState("");

  useEffect(() => {
    async function fetchAuthorData() {
      try {
        const firstName = await getAuthorFirstName(authorid);
        setAuthorFirstName(firstName || "Unknown");
      } catch (error) {
        console.error("Error fetching author data:", error);
      }
    }

    fetchAuthorData();
  }, [authorid]);

  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public";

  return (
    <div className="mb-4 w-full overflow-hidden rounded-lg bg-raisinblack shadow-lg lg:w-auto">
      <div className="p-4">
        {postphoto && (
          <img
            src={`${supabaseStorageBaseUrl}/${postphoto}`}
            alt="Post Image"
            className="mb-2 w-full rounded-lg object-cover"
          />
        )}
        <p className="text-sm text-light">{content}</p>
        <p className="mt-2 text-xs text-gray-500">
          {new Date(createdat).toLocaleString()}
        </p>
        <p className="mt-2 text-xs text-gray-500">By: {authorFirstName}</p>{" "}
        {/* Display author's first name */}
      </div>
    </div>
  );
};

export default PostsCard;
