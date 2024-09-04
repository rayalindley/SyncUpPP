import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, ToastContainer } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import { insertPost, updatePost, checkIsMemberOfOrganization } from "@/lib/posts";
import { PhotoIcon, XCircleIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { getUserProfileById } from "@/lib/user_actions";
import { useUser } from "@/context/user_context";
import { check_permissions } from "@/lib/organization";
import "react-toastify/dist/ReactToastify.css";
import { Posts } from "@/types/posts"; // Ensure this matches your actual types

const postSchema = z.object({
  content: z
    .string()
    .min(1, "Content is required")
    .max(500, "Content cannot exceed 500 characters"),
  privacyLevel: z.enum(["public", "private"]),
});

const privacyLevels = [
  { name: "Public", value: "public" },
  { name: "Private", value: "private" },
];

const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

interface PostsTextAreaProps {
  organizationid: string;
  postsData: Posts[];
  setPostsData: React.Dispatch<React.SetStateAction<Posts[]>>;
  editingPost: Posts | null;
  cancelEdit: () => void;
  setEditingPost: React.Dispatch<React.SetStateAction<Posts | null>>;
}

export default function PostsTextArea({
  organizationid,
  postsData,
  setPostsData,
  editingPost,
  cancelEdit,
  setEditingPost,
}: PostsTextAreaProps) {
  const { register, handleSubmit, control, watch, setValue, reset } = useForm({
    resolver: zodResolver(postSchema),
  });
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

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
          setProfilePicture(
            data.profilepicture
              ? `${supabaseStorageBaseUrl}/${data.profilepicture}`
              : null
          );
        } else {
          console.error("Error fetching user profile:", error);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const checkMembershipAndPermissions = async () => {
      if (organizationid) {
        const isMember = await checkIsMemberOfOrganization(organizationid);
        setIsMember(isMember);
        if (user?.id) {
          const [createPermission, editPermission] = await Promise.all([
            check_permissions(user.id, organizationid, "create_posts"),
            check_permissions(user.id, organizationid, "edit_posts"),
          ]);
          setCanCreate(createPermission);
          setCanEdit(editPermission);
        }
      }
    };
    checkMembershipAndPermissions();
  }, [organizationid, user]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
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

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const resetForm = () => {
    reset();
    setPhotos([]);
    setEditingPost(null);
  };

  const onSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const postData = { ...formData, organizationid, postphotos: photos };
      const { data: postResponse, error } = editingPost
        ? await updatePost({ ...postData, postid: editingPost.postid })
        : await insertPost(postData, organizationid);

      if (!error) {
        if (editingPost) {
          setPostsData(
            postsData.map((post) =>
              post.postid === postResponse.postid ? postResponse : post
            )
          );
          toast.success("Post updated successfully");
        } else {
          setPostsData([postResponse, ...postsData]);
          toast.success("Post created successfully");
        }
        resetForm();
      } else {
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast.error("Failed to create/update post. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const contentValue = watch("content");

  if (!isMember) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative rounded-2xl bg-[#3b3b3b] p-6 shadow-lg"
    >
      <div className="rounded-2xl">
        <label htmlFor="content" className="sr-only">
          Description
        </label>
        <div className="mb-4 flex items-center">
          <div>
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-10 w-10 text-white" />
            )}
          </div>
          <div className="relative ml-4 flex-grow">
            <textarea
              id="content"
              {...register("content")}
              className="min-h-[150px] w-full resize-none rounded-2xl border border-[#3d3d3d] bg-[#171717] p-3 text-white focus:ring-0"
              placeholder="Write a post..."
              maxLength={500}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
              disabled={!canCreate && !editingPost}
            />
            <div className="absolute bottom-2 right-2 text-sm text-[#bebebe]">
              {contentValue?.length || 0}/500
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <Controller
            name="privacyLevel"
            control={control}
            defaultValue={privacyLevels[0].value}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-40 rounded-2xl border border-[#3d3d3d] bg-[#171717] p-3 text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!canCreate && !editingPost}
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
            disabled={!canCreate && !editingPost}
          />
          <label htmlFor="file-input" className="cursor-pointer p-3">
            <PhotoIcon className="h-6 w-6 text-white" />
          </label>
          <div className="flex-grow"></div>
          <button
            type="submit"
            className={`rounded-2xl p-3 text-white shadow-lg ${isLoading || !(contentValue ?? "").trim() ? "cursor-not-allowed bg-[#171717]" : "bg-primary hover:bg-[#37996b]"}`}
            disabled={isLoading || !(contentValue ?? "").trim() || (!canCreate && !editingPost)}
          >
            {isLoading
              ? editingPost
                ? "Updating..."
                : "Creating..."
              : editingPost
                ? "Update"
                : "Create"}
          </button>
          {editingPost && (
            <button
              type="button"
              onClick={() => {
                cancelEdit();
                resetForm();
              }}
              className="ml-2 rounded-2xl bg-red-600 p-3 text-white shadow-lg hover:bg-red-700"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={`${supabaseStorageBaseUrl}/post-images/${photo}`}
                alt={`Attachment ${index + 1}`}
                className="h-20 w-20 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute right-0 top-0 rounded-full bg-black bg-opacity-75 p-1 text-white"
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
