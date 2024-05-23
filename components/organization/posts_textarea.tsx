import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, ToastContainer } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import { insertPost, updatePost } from "@/lib/posts";
import { PhotoIcon, XCircleIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { getUserProfileById } from "@/lib/userActions";
import { useUser } from "@/context/UserContext";
import 'react-toastify/dist/ReactToastify.css';

const postSchema = z.object({
  content: z.string().min(1, "Content is required").max(500, "Content cannot exceed 500 characters"),
  privacyLevel: z.enum(["public", "private"]),
});

const privacyLevels = [
  { name: "Public", value: "public" },
  { name: "Private", value: "private" },
];

const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

export default function PostsTextArea({ organizationid, postsData, setPostsData, editingPost, cancelEdit, setEditingPost }) {
  const { register, handleSubmit, control, watch, setValue, reset } = useForm({
    resolver: zodResolver(postSchema),
  });
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    if (editingPost) {
      setValue("content", editingPost.content);
      setValue("privacyLevel", editingPost.privacylevel);
      setPhotos(editingPost.postphotos || []);
    }
  }, [editingPost, setValue]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data, error } = await getUserProfileById(user.id);
        if (data) {
          setProfilePicture(data.profilepicture ? `${supabaseStorageBaseUrl}/${data.profilepicture}` : null);
        } else {
          console.error("Error fetching user profile:", error);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith("image/"));
    const newPhotos = [...photos];

    for (const file of imageFiles) {
      setIsLoading(true);
      const fileName = `post_${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: uploadResult, error } = await createClient()
        .storage.from("post-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadResult) {
        newPhotos.push(uploadResult.path);
      } else {
        console.error("Error uploading image:", error);
      }
    }

    setPhotos(newPhotos);
    setIsLoading(false);
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const resetForm = () => {
    reset();
    setPhotos([]);
    setEditingPost(null);
  };

  const onSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const postData = { ...formData, organizationid, postphotos: photos };
      const { data: postResponse, error } = editingPost
        ? await updatePost({ ...postData, postid: editingPost.postid })
        : await insertPost(postData, organizationid);

      if (!error) {
        if (editingPost) {
          setPostsData(postsData.map(post => (post.postid === postResponse.postid ? postResponse : post)));
          toast.success("Post updated successfully");
        } else {
          setPostsData([postResponse, ...postsData]);
          toast.success("Post created successfully");
        }
        resetForm();
      } else {
        throw new Error(error.message);
      }
    } catch (error) {
      toast.error("Failed to create/update post. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const contentValue = watch('content');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative p-6 bg-[#3b3b3b] rounded-2xl shadow-lg">
      <div className="rounded-2xl">
        <label htmlFor="content" className="sr-only">
          Description
        </label>
        <div className="flex items-center mb-4">
          <div>
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <UserCircleIcon className="h-10 w-10 text-white" />
            )}
          </div>
          <div className="flex-grow ml-4 relative">
            <textarea
              id="content"
              {...register("content")}
              className="min-h-[150px] w-full bg-[#171717] text-white border border-[#3d3d3d] rounded-2xl p-3 resize-none focus:ring-0"
              placeholder="Write a post..."
            />
            <div className="absolute bottom-2 right-2 text-[#bebebe] text-sm">
              {contentValue?.length || 0}/500
            </div>
          </div>
        </div>
        <div className="flex items-center mb-4 gap-2">
          <Controller
            name="privacyLevel"
            control={control}
            defaultValue={privacyLevels[0].value}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="p-3 border border-[#3d3d3d] bg-[#171717] text-white rounded-2xl w-40"
              >
                {privacyLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.name}
                  </option>
                ))}
              </select>
            )}
          />
          <input
            type="file"
            accept="image/*"
            id="file-input"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-input" className="cursor-pointer p-3">
            <PhotoIcon className="h-6 w-6 text-white" />
          </label>
          <div className="flex-grow"></div>
          <button
            type="submit"
            className={`p-3 rounded-2xl text-white shadow-lg ${isLoading || !(contentValue ?? "").trim() ? "bg-[#171717] cursor-not-allowed" : "bg-primary hover:bg-[#37996b]"}`}
            disabled={isLoading || !(contentValue ?? "").trim()}
          >
            {isLoading ? (editingPost ? "Updating..." : "Creating...") : (editingPost ? "Update" : "Create")}
          </button>
          {editingPost && (
            <button
              type="button"
              onClick={() => { cancelEdit(); resetForm(); }}
              className="p-3 rounded-2xl text-white shadow-lg bg-red-600 hover:bg-red-700 ml-2"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img src={`${supabaseStorageBaseUrl}/${photo}`} alt={`Attachment ${index + 1}`} className="h-20 w-20 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-0 right-0 bg-black bg-opacity-75 rounded-full p-1 text-white"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <ToastContainer />
    </form>
  );
}
