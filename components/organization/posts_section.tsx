"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PhotoIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { Switch } from "@headlessui/react";
import { useUser } from "@/context/user_context";
import {
  insertPost,
  updatePost,
  fetchPosts,
  fetchRolesAndMemberships,
  getAuthorDetails,
  deletePost,
  fetchPostRoles,
  fetchPostMemberships,
  check_permissions,
} from "@/lib/posts_tab";
import { Posts } from "@/types/posts";
import TagsInput from "../custom/tags-input";
import CommentsSection from "./comments_section";
import Swal from "sweetalert2";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const supabase = createClient();

const postSchema = z.object({
  content: z.string().min(1, "Content is required").max(500),
  selectedRoles: z.array(z.string()).optional(),
  selectedMemberships: z.array(z.string()).optional(),
});

interface PostsSectionProps {
  organizationId: string;
}

const PostsSection: React.FC<PostsSectionProps> = ({ organizationId }) => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Posts[]>([]);
  const [editingPost, setEditingPost] = useState<Posts | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);
  const [availableMemberships, setAvailableMemberships] = useState<{ membershipid: string; name: string }[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creationMessage, setCreationMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByRole, setFilterByRole] = useState<string | null>(null);
  const [filterByMembership, setFilterByMembership] = useState<string | null>(null);
  const [filterByAuthor, setFilterByAuthor] = useState<boolean>(false);
  const [filterByPublic, setFilterByPublic] = useState<boolean>(false);
  const [filterByDate, setFilterByDate] = useState<Date | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const { register, handleSubmit, control, setValue, reset, watch } = useForm({
    resolver: zodResolver(postSchema),
  });

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  const isLoggedIn = user && user.id && user.id.length > 0;

  const fetchPermissions = useCallback(async () => {
    if (!isLoggedIn) {
      setCanCreate(false);
      setCanDelete(false);
      return;
    }

    try {
      const [createPermission, deletePermission] = await Promise.all([
        check_permissions(user?.id ?? "", organizationId, "create_posts"),
        check_permissions(user?.id ?? "", organizationId, "delete_posts"),
      ]);

      setCanCreate(!!createPermission);
      setCanDelete(!!deletePermission);
    } catch (error) {
      console.error("Error checking permissions", error);
      setCanCreate(false);
      setCanDelete(false);
    }
  }, [isLoggedIn, user?.id, organizationId]);

  const fetchData = useCallback(async () => {
    const [{ data: postData, error: postError }, rolesAndMemberships] = await Promise.all(
      [
        fetchPosts(organizationId, user?.id ?? null),
        fetchRolesAndMemberships(organizationId),
      ]
    );

    if (postError) {
      console.error("Error fetching posts:", postError.message);
      setCreationMessage({ text: postError.message, type: "error" });
    } else {
      const postsWithPrivacy = await Promise.all(
        (postData || []).map(async (post: Posts) => {
          const [roles, memberships] = await Promise.all([
            fetchPostRoles(post.postid),
            fetchPostMemberships(post.postid),
          ]);
          return { ...post, roles, memberships, created_at: post.createdat };
        })
      );
      setPosts(postsWithPrivacy);
    }

    // Check if rolesAndMemberships is defined before accessing its properties
    if (rolesAndMemberships && rolesAndMemberships.error) {
      console.error("Error fetching roles and memberships:", rolesAndMemberships.error);
      setCreationMessage({ text: rolesAndMemberships.error, type: "error" });
    } else if (rolesAndMemberships) {
      setAvailableRoles(
        rolesAndMemberships.roles.map((role: any) => ({ id: role.id, name: role.name }))
      );
      setAvailableMemberships(
        rolesAndMemberships.memberships.map((membership: any) => ({
          membershipid: membership.membershipid,
          name: membership.name,
        }))
      );
    }
  }, [organizationId, user?.id]);

  useEffect(() => {
    fetchData();
    fetchPermissions();
  }, [fetchData, fetchPermissions]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotoFiles(files);
    const newPhotos = files.map((file) => URL.createObjectURL(file));
    setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
  };

  const handleRemovePhoto = (index: number, isExistingPhoto: boolean) => {
    if (isExistingPhoto) {
      setRemovedPhotos((prev) => [...prev, photos[index]]);
    }
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
    setPhotoFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const uploadPhotosToSupabase = async () => {
    const uploadedUrls: string[] = [];
    for (const file of photoFiles) {
      const fileName = `post_${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: uploadResult, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, file);

      if (uploadResult) {
        const imageUrl = `${supabaseStorageBaseUrl}/post-images/${uploadResult.path}`;
        uploadedUrls.push(imageUrl);
      } else {
        console.error("Error uploading image:", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Error uploading image. Please try again.",
        });
        return null;
      }
    }
    return uploadedUrls;
  };

  const resetForm = () => {
    reset();
    setPhotos([]);
    setPhotoFiles([]);
    setRemovedPhotos([]);
    setEditingPost(null);
    setIsPublic(false);
  };

  const onSubmit = async (formData: any) => {
    if (!isLoggedIn) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You must be logged in to create or edit posts.",
      });
      return;
    }
    if (!canCreate && !editingPost) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You do not have permission to create posts.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedRolesUUIDs =
        formData.selectedRoles
          ?.map(
            (roleName: string) =>
              availableRoles.find((role) => role.name === roleName)?.id
          )
          .filter(Boolean) || [];

      const selectedMembershipUUIDs =
        formData.selectedMemberships
          ?.map(
            (membershipName: string) =>
              availableMemberships.find(
                (membership) => membership.name === membershipName
              )?.membershipid
          )
          .filter(Boolean) || [];

      if (selectedRolesUUIDs.length === 0 && selectedMembershipUUIDs.length === 0) {
        setIsPublic(true);
      }

      const uploadedPhotoUrls = await uploadPhotosToSupabase();
      if (uploadedPhotoUrls === null) {
        setIsLoading(false);
        return;
      }

      const retainedPhotos = editingPost
        ? (editingPost.postphotos || []).filter((photo) => !removedPhotos.includes(photo))
        : [];

      const finalPhotoUrls = [...retainedPhotos, ...uploadedPhotoUrls];

      const postPayload = {
        ...formData,
        organizationid: organizationId,
        postphotos: finalPhotoUrls,
        authorid: user.id,
        targetroles: selectedRolesUUIDs,
        targetmemberships: selectedMembershipUUIDs,
      };

      const result = editingPost
        ? await updatePost({ ...postPayload, postid: editingPost.postid })
        : await insertPost(postPayload, organizationId);

      if (result.data) {
        resetForm();
        setCreationMessage({
          text: editingPost ? "Post updated" : "Post created",
          type: "success",
        });
        await fetchData();
      } else {
        console.error("Failed to save post:", result.error);
        setCreationMessage({ text: "Failed to save post", type: "error" });
      }
    } catch (error) {
      console.error("Error during post submission:", error);
      setCreationMessage({
        text: "An unexpected error occurred while saving the post.",
        type: "error",
      });
    }

    setIsLoading(false);
    setTimeout(() => setCreationMessage(null), 3000);
  };

  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch = post.content
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRole = filterByRole ? post.roles?.includes(filterByRole) : true;
      const matchesMembership = filterByMembership
        ? post.memberships?.includes(filterByMembership)
        : true;
      const matchesAuthor = filterByAuthor ? post.authorid === user?.id : true;
      const matchesPublic = filterByPublic
        ? !post.roles?.length && !post.memberships?.length
        : true;

      const matchesDate = filterByDate
        ? post.createdat &&
          new Date(post.createdat).toDateString() === filterByDate.toDateString()
        : true;

      return (
        matchesSearch &&
        matchesRole &&
        matchesMembership &&
        matchesAuthor &&
        matchesPublic &&
        matchesDate
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdat ?? 0).getTime() - new Date(a.createdat ?? 0).getTime()
    );

  useEffect(() => {
    if (editingPost) {
      setValue("content", editingPost.content);
      setPhotos(editingPost.postphotos || []);
      setValue("selectedRoles", editingPost.selectedRoles || []);
      setValue("selectedMemberships", editingPost.selectedMemberships || []);
      setIsPublic(
        !editingPost.selectedRoles?.length && !editingPost.selectedMemberships?.length
      );
    }
  }, [editingPost, setValue]);

  const handleFilterByPublicChange = (checked: boolean) => {
    setFilterByPublic(checked);
    if (checked) {
      setFilterByRole(null);
      setFilterByMembership(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mb-5 w-full text-center">
        <p className="mt-2 w-full text-2xl font-bold tracking-tight text-light sm:text-2xl">
          Posts Section
        </p>
      </div>
      {isLoggedIn && canCreate && (
        <div className="space-y-4 rounded-lg bg-[#3b3b3b] p-4 shadow-lg sm:p-6 lg:p-8">
          <form id="post-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <textarea
              {...register("content")}
              className="w-full resize-none rounded-lg border border-[#3d3d3d] bg-[#171717] p-2 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:p-3 lg:p-4"
              placeholder="Write a post..."
              maxLength={500}
              disabled={isLoading}
            />
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-white">Public</label>
                <Switch
                  checked={isPublic}
                  onChange={(checked) => {
                    setIsPublic(checked);
                    if (checked) {
                      setValue("selectedRoles", []);
                      setValue("selectedMemberships", []);
                    }
                  }}
                  className={`${
                    isPublic ? "bg-green-600" : "bg-gray-700"
                  } relative inline-flex h-6 w-11 items-center rounded-full`}
                >
                  <span
                    className={`${
                      isPublic ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              {!isPublic && (
                <>
                  <Controller
                    name="selectedRoles"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <TagsInput
                        value={field.value}
                        onChange={(tags) => field.onChange(tags)}
                        suggestions={availableRoles.map((role) => role.name)}
                        placeholder="Roles (Optional)"
                        className="w-full rounded-lg border border-[#3d3d3d] bg-[#3b3b3b] p-2 text-white"
                      />
                    )}
                  />
                  <Controller
                    name="selectedMemberships"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => (
                      <TagsInput
                        value={field.value}
                        onChange={(tags) => field.onChange(tags)}
                        suggestions={availableMemberships.map(
                          (membership) => membership.name
                        )}
                        placeholder="Memberships (Optional)"
                        className="w-full rounded-lg border border-[#3d3d3d] bg-[#3b3b3b] p-2 text-white"
                      />
                    )}
                  />
                </>
              )}
            </div>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor="file-input"
                className="cursor-pointer rounded-lg bg-[#171717] p-2 text-white hover:bg-[#1f1f1f]"
              >
                <PhotoIcon className="inline-block h-6 w-6" />
                Add Photo
                <input
                  type="file"
                  accept="image/*"
                  id="file-input"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                type="submit"
                className={`rounded-lg bg-primary p-2 text-white shadow-md hover:bg-[#37996b] ${
                  isLoading || !watch("content")?.trim() ? "cursor-not-allowed" : ""
                }`}
                disabled={isLoading || !watch("content")?.trim()}
              >
                {isLoading ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
              </button>
              {editingPost && (
                <button
                  type="button"
                  className="rounded-lg bg-gray-600 p-2 text-white shadow-md hover:bg-gray-700"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
            {photos.length > 0 && (
              <div className="mt-4 flex space-x-2 overflow-x-auto">
                {photos.map((photo, index) => (
                  <div key={index} className="relative h-24 w-24">
                    <img
                      src={photo}
                      alt={`Attachment ${index + 1}`}
                      className="h-full w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleRemovePhoto(
                          index,
                          !!(editingPost && editingPost.postphotos?.includes(photo))
                        )
                      }
                      className="absolute right-1 top-1 rounded-full bg-black bg-opacity-75 p-1 text-white"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {creationMessage && (
              <div
                className={`mt-4 rounded-lg p-4 text-white ${
                  creationMessage.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {creationMessage.text}
              </div>
            )}
          </form>
        </div>
      )}

      {isLoggedIn && canCreate && (
        <div className="mb-4 mt-8 flex flex-wrap items-center space-x-2 space-y-2 rounded-lg bg-[#1e1e1e] p-4 shadow-lg">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] px-3 py-2 pl-10 text-white placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <i className="fas fa-search"></i>
            </span>
          </div>
          <div className="h-full w-px bg-gray-600"></div>
          <div className="relative">
            <select
              value={filterByRole || ""}
              onChange={(e) => setFilterByRole(e.target.value || null)}
              disabled={filterByPublic}
              className={`w-full rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] px-3 py-2 pr-10 text-white focus:border-transparent focus:ring-2 focus:ring-primary ${
                filterByPublic ? "cursor-not-allowed bg-gray-700 text-gray-500" : ""
              }`}
            >
              <option value="">Filter by Role</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-2.5 text-gray-400">
              <i className="fas fa-chevron-down"></i>
            </span>
          </div>
          <div className="h-full w-px bg-gray-600"></div>
          <div className="relative">
            <select
              value={filterByMembership || ""}
              onChange={(e) => setFilterByMembership(e.target.value || null)}
              disabled={filterByPublic}
              className={`w-full rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] px-3 py-2 pr-10 text-white focus:border-transparent focus:ring-2 focus:ring-primary ${
                filterByPublic ? "cursor-not-allowed bg-gray-700 text-gray-500" : ""
              }`}
            >
              <option value="">Filter by Membership</option>
              {availableMemberships.map((membership) => (
                <option key={membership.membershipid} value={membership.membershipid}>
                  {membership.name}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-2.5 text-gray-400">
              <i className="fas fa-chevron-down"></i>
            </span>
          </div>
          <div className="h-full w-px bg-gray-600"></div>
          <label className="flex items-center space-x-1 text-white">
            <input
              type="checkbox"
              checked={filterByAuthor}
              onChange={(e) => setFilterByAuthor(e.target.checked)}
              className="form-checkbox h-4 w-4 rounded border-[#3d3d3d] bg-[#2a2a2a] text-primary focus:border-transparent focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm">Authored by Me</span>
          </label>
          <div className="h-full w-px bg-gray-600"></div>
          <label className="flex items-center space-x-1 text-white">
            <input
              type="checkbox"
              checked={filterByPublic}
              onChange={(e) => {
                handleFilterByPublicChange(e.target.checked);
              }}
              className="form-checkbox h-4 w-4 rounded border-[#3d3d3d] bg-[#2a2a2a] text-primary focus:border-transparent focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm">Public Posts</span>
          </label>
          <div className="h-full w-px bg-gray-600"></div>
          <div className="flex items-center space-x-1 text-white">
            <label className="text-sm">Filter by Date:</label>
            <ReactDatePicker
              selected={filterByDate}
              onChange={(date: Date | null) => setFilterByDate(date)}
              isClearable
              placeholderText="Select Date"
              className="rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] px-3 py-2 text-white focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {(filteredPosts.length <= 0 || isLoading) && (
          <div
            className="mb-4 rounded-lg bg-gray-800 p-4 text-center text-sm text-blue-400"
            role="alert"
          >
            {isLoading
              ? "Checking permissions..."
              : "The organization has no posts available for you at the moment."}
          </div>
        )}
        {filteredPosts.map((post) => (
          <PostCard
            key={post.postid}
            post={post}
            setPosts={setPosts}
            setEditingPost={setEditingPost}
            availableRoles={availableRoles}
            availableMemberships={availableMemberships}
            canDelete={canDelete}
            organizationId={organizationId}
          />
        ))}
      </div>
    </div>
  );
};

PostsSection.displayName = "PostsSection";

const PostCard: React.FC<{
  post: Posts;
  setPosts: React.Dispatch<React.SetStateAction<Posts[]>>;
  setEditingPost: React.Dispatch<React.SetStateAction<Posts | null>>;
  availableRoles: { id: string; name: string }[];
  availableMemberships: { membershipid: string; name: string }[];
  canDelete: boolean;
  organizationId: string;
}> = memo(
  ({
    post,
    setPosts,
    setEditingPost,
    availableRoles,
    availableMemberships,
    canDelete,
    organizationId,
  }) => {
    const { content, authorid, postphotos, postid, createdat } = post;
    const [authorDetails, setAuthorDetails] = useState<{
      firstName: string;
      lastName: string;
      profilePicture: string | null;
    }>({ firstName: "", lastName: "", profilePicture: null });
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(true);

    const { user } = useUser();
    const isLoggedIn = user && user.id && user.id.length > 0;
    const isCurrentUserAuthor = user?.id === authorid;

    const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

    useEffect(() => {
      const fetchPostPrivacy = async () => {
        setIsLoadingPrivacy(true);
        const [roles, memberships] = await Promise.all([
          fetchPostRoles(postid),
          fetchPostMemberships(postid),
        ]);
        setSelectedRoles(roles);
        setSelectedMemberships(memberships);
        setIsLoadingPrivacy(false);
      };

      fetchPostPrivacy();

      getAuthorDetails(authorid).then((details) => {
        if (details) {
          setAuthorDetails({
            firstName: details.first_name || "",
            lastName: details.last_name || "",
            profilePicture: details.profilepicture
              ? `${supabaseStorageBaseUrl}/${details.profilepicture}`
              : null,
          });
        }
      });
    }, [authorid, postid]);

    const handleDelete = () => {
      if (!canDelete) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "You do not have permission to delete posts.",
        });
        return;
      }

      Swal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this post?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const { error } = await deletePost(postid, authorid);
            if (!error) {
              setIsDeleted(true);
              setTimeout(
                () =>
                  setPosts((prevPosts) => prevPosts.filter((p) => p.postid !== postid)),
                3000
              );
            }
          } catch (error) {
            console.error("Error deleting post", error);
          }
        }
      });
    };

    const handleEdit = () => {
      const roleNames = selectedRoles.map(
        (roleId) => availableRoles.find((role) => role.id === roleId)?.name || ""
      );

      const membershipNames = selectedMemberships
        .map(
          (membershipId) =>
            availableMemberships.find(
              (membership) => membership.membershipid === membershipId
            )?.name || ""
        )
        .filter(Boolean);

      setEditingPost({
        ...post,
        selectedRoles: roleNames,
        selectedMemberships: membershipNames,
      });
    };

    const generatePrivacyLabel = () => {
      if (isLoadingPrivacy) {
        return (
          <span className="inline-block rounded-full bg-yellow-500 px-2 py-1 text-xs text-white">
            Loading...
          </span>
        );
      }

      const roleLabels = selectedRoles.map((roleId) => {
        const roleName = availableRoles.find((role) => role.id === roleId)?.name;
        return (
          <span
            key={roleId}
            className="inline-block rounded-full bg-blue-500 px-2 py-1 text-xs text-white"
          >
            {roleName}
          </span>
        );
      });

      const membershipLabels = selectedMemberships.map((membershipId) => {
        const membershipName = availableMemberships.find(
          (membership) => membership.membershipid === membershipId
        )?.name;
        return (
          <span
            key={membershipId}
            className="inline-block rounded-full bg-purple-500 px-2 py-1 text-xs text-white"
          >
            {membershipName}
          </span>
        );
      });

      if (roleLabels.length || membershipLabels.length) {
        return [...roleLabels, ...membershipLabels];
      }

      return (
        <span className="inline-block rounded-full bg-green-500 px-2 py-1 text-xs text-white">
          Public
        </span>
      );
    };

    if (isDeleted) {
      return (
        <div className="mt-4 rounded-lg bg-red-500 p-4 text-white">
          Post deleted successfully.
        </div>
      );
    }

    const galleryImages =
      postphotos?.map((photo) => ({
        original: photo,
        thumbnail: photo,
      })) || [];

    return (
      <div className="relative rounded-lg bg-[#171717] p-4 shadow-lg">
        {isLoggedIn && (
          <div className="absolute right-2 top-2 flex items-center space-x-2">
            {isCurrentUserAuthor && (
              <button className="text-gray-500 hover:text-gray-400" onClick={handleEdit}>
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {(isCurrentUserAuthor || canDelete) && (
              <button
                className="text-gray-500 hover:text-gray-400"
                onClick={handleDelete}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#424242]">
            {authorDetails.profilePicture ? (
              <img
                src={authorDetails.profilePicture}
                alt={`${authorDetails.firstName}'s profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-10 w-10 text-white" />
            )}
          </div>
          <div>
            <p className="text-white">
              {authorDetails.firstName} {authorDetails.lastName}
            </p>
            <p className="text-sm text-gray-400">
              {createdat
                ? format(new Date(createdat), "MMMM dd, yyyy hh:mm a")
                : "Unknown date"}
            </p>
            <div className="flex flex-wrap space-x-2">{generatePrivacyLabel()}</div>
          </div>
        </div>
        <p className="mb-5 mt-5 break-words rounded-lg bg-[#2a2a2a] p-4 text-white">
          {content}
        </p>
        {galleryImages.length > 0 && (
          <div className="mt-5">
            <ImageGallery items={galleryImages} showPlayButton={false} />
          </div>
        )}
        <CommentsSection postId={postid} organizationId={organizationId} />
      </div>
    );
  }
);

PostCard.displayName = "PostCard";

export default PostsSection;
