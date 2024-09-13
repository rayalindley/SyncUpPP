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
} from "@/lib/groups/posts_tab";
import { Posts } from "@/types/posts";
import TagsInput from "../custom/tags-input";
import CommentsSection from "./comments_section";
import Swal from "sweetalert2";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { createClient } from "@/lib/supabase/client";

import { format } from "date-fns";

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
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>(
    []
  );
  const [availableMemberships, setAvailableMemberships] = useState<
    { membershipid: string; name: string }[]
  >([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creationMessage, setCreationMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByRole, setFilterByRole] = useState<string | null>(null);
  const [filterByMembership, setFilterByMembership] = useState<string | null>(null);
  const [filterByAuthor, setFilterByAuthor] = useState<boolean>(false);
  const [filterByPublic, setFilterByPublic] = useState<boolean>(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const { register, handleSubmit, control, setValue, reset, watch } = useForm({
    resolver: zodResolver(postSchema),
  });

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

  const fetchPermissions = useCallback(async () => {
    if (user) {
      const createPermission = user?.id
        ? await check_permissions(user.id, organizationId, "create_posts")
        : false;
      const editPermission = user?.id
        ? await check_permissions(user.id, organizationId, "edit_posts")
        : false;
      const deletePermission = user?.id
        ? await check_permissions(user.id, organizationId, "delete_posts")
        : false;

      setCanCreate(!!createPermission);
      setCanEdit(!!editPermission);
      setCanDelete(!!deletePermission);
    }
  }, [user, organizationId]);

  const fetchUserPosts = useCallback(async () => {
    const data = await fetchPosts(organizationId, user?.id ?? null);
    if (data.error) {
      console.error("Error fetching posts:", data.error.message);
      setCreationMessage({ text: data.error.message, type: "error" });
    } else {
      const postsWithPrivacy = await Promise.all(
        (data.data || []).map(async (post: Posts) => {
          const roles = await fetchPostRoles(post.postid);
          const memberships = await fetchPostMemberships(post.postid);
          return { ...post, roles, memberships, created_at: post.createdat };
        })
      );

      setPosts(postsWithPrivacy);
    }
  }, [organizationId, user?.id]);

  const fetchRolesAndMembershipsData = useCallback(async () => {
    const { roles, memberships, error } = await fetchRolesAndMemberships(organizationId);
    if (error) {
      console.error("Error fetching roles and memberships:", error);
      setCreationMessage({ text: error, type: "error" });
    } else {
      setAvailableRoles(roles.map((role: any) => ({ id: role.id, name: role.name })));
      setAvailableMemberships(
        memberships.map((membership: any) => ({
          membershipid: membership.membershipid,
          name: membership.name,
        }))
      );
    }
  }, [organizationId]);

  useEffect(() => {
    fetchUserPosts();
    fetchRolesAndMembershipsData();
    fetchPermissions();
  }, [fetchUserPosts, fetchRolesAndMembershipsData, fetchPermissions]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });
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
    if (!canCreate && !editingPost) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You do not have permission to create posts.",
      });
      return;
    }
    if (!canEdit && editingPost) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You do not have permission to edit posts.",
      });
      return;
    }
    setIsLoading(true);
    try {
      if (!user || !user.id) {
        console.error("No user found, cannot submit post.");
        setCreationMessage({
          text: "You must be logged in to create a post.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      const selectedRolesUUIDs = formData.selectedRoles
        .map((roleName: string) => {
          const matchedRole = availableRoles.find((role) => role.name === roleName);
          return matchedRole ? matchedRole.id : null;
        })
        .filter((id: string | null) => id !== null);

      const selectedMembershipUUIDs = formData.selectedMemberships
        .map((membershipName: string) => {
          const matchedMembership = availableMemberships.find(
            (membership) => membership.name === membershipName
          );
          return matchedMembership ? matchedMembership.membershipid : null;
        })
        .filter((id: string | null) => id !== null);

      const isPostPublic =
        selectedRolesUUIDs.length === 0 && selectedMembershipUUIDs.length === 0;

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
        await fetchUserPosts();
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
      const matchesSearch = (post.content ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRole = filterByRole
        ? post.roles?.includes(filterByRole) ?? false
        : true;
      const matchesMembership = filterByMembership
        ? post.memberships?.includes(filterByMembership) ?? false
        : true;
      const matchesAuthor = filterByAuthor ? post.authorid === user?.id : true;
      const matchesPublic = filterByPublic
        ? post.roles?.length === 0 && post.memberships?.length === 0
        : true;
      return (
        matchesSearch &&
        matchesRole &&
        matchesMembership &&
        matchesAuthor &&
        matchesPublic
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdat ?? 0).getTime();
      const dateB = new Date(b.createdat ?? 0).getTime();
      return dateB - dateA;
    });

  useEffect(() => {
    if (editingPost) {
      setValue("content", editingPost.content);
      setPhotos(editingPost.postphotos || []);
      setValue("selectedRoles", editingPost.selectedRoles || []);
      setValue("selectedMemberships", editingPost.selectedMemberships || []);

      const postIsPublic =
        (editingPost.selectedRoles ?? []).length === 0 &&
        (editingPost.selectedMemberships ?? []).length === 0;
      setIsPublic(postIsPublic);

      const formElement = document.getElementById("post-form");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [editingPost, setValue]);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 rounded-lg bg-[#3b3b3b] p-4 shadow-lg sm:p-6 lg:p-8">
        <form id="post-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <textarea
            {...register("content")}
            className="w-full resize-none rounded-lg border border-[#3d3d3d] bg-[#171717] p-2 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:p-3 lg:p-4"
            placeholder="Write a post..."
            maxLength={500}
            disabled={isLoading}
          />
          <div className="flex min-w-0 flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-4 sm:space-y-0">
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
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                />
              </Switch>
            </div>
            <Controller
              name="selectedRoles"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <TagsInput
                  value={field.value}
                  onChange={(tags) => {
                    field.onChange(tags);
                    if (tags.length > 0) {
                      setIsPublic(false);
                    }
                  }}
                  suggestions={availableRoles.map((role) => role.name)}
                  placeholder="Roles (Optional)"
                  className="w-full rounded-lg border border-[#3d3d3d] bg-[#3b3b3b] p-2 text-white sm:p-3 lg:p-4"
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
                  onChange={(tags) => {
                    field.onChange(tags);
                    if (tags.length > 0) {
                      setIsPublic(false);
                    }
                  }}
                  suggestions={availableMemberships.map((membership) => membership.name)}
                  placeholder="Memberships (Optional)"
                  className="w-full rounded-lg border border-[#3d3d3d] bg-[#3b3b3b] p-2 text-white sm:p-3 lg:p-4"
                />
              )}
            />
          </div>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <label
              htmlFor="file-input"
              className="cursor-pointer rounded-lg bg-[#171717] p-2 text-white hover:bg-[#1f1f1f] sm:p-3 lg:p-4"
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
              className={`rounded-lg bg-primary p-2 text-white shadow-md hover:bg-[#37996b] sm:p-3 lg:p-4 ${
                isLoading || !watch("content")?.trim() ? "cursor-not-allowed" : ""
              }`}
              disabled={isLoading || !watch("content")?.trim()}
            >
              {isLoading ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
            </button>
            {editingPost && (
              <button
                type="button"
                className="rounded-lg bg-gray-600 p-2 text-white shadow-md hover:bg-gray-700 sm:p-3 lg:p-4"
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

      <div className="mb-4 mt-8 flex flex-wrap space-x-4 rounded-lg bg-[#1e1e1e] p-4 shadow-lg sm:p-6 lg:p-8">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] p-3 text-white placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-primary sm:p-4 lg:p-5"
          style={{ lineHeight: "1.5", marginBottom: "0.5rem" }}
        />
        <select
          value={filterByRole || ""}
          onChange={(e) => setFilterByRole(e.target.value || null)}
          className="rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] p-3 text-white focus:border-transparent focus:ring-2 focus:ring-primary sm:p-4 lg:p-5"
          style={{ lineHeight: "1.5", marginBottom: "0.5rem" }}
        >
          <option value="">Filter by Role</option>
          {availableRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <select
          value={filterByMembership || ""}
          onChange={(e) => setFilterByMembership(e.target.value || null)}
          className="rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] p-3 text-white focus:border-transparent focus:ring-2 focus:ring-primary sm:p-4 lg:p-5"
          style={{ lineHeight: "1.5", marginBottom: "0.5rem" }}
        >
          <option value="">Filter by Membership</option>
          {availableMemberships.map((membership) => (
            <option key={membership.membershipid} value={membership.membershipid}>
              {membership.name}
            </option>
          ))}
        </select>
        <label
          className="flex items-center space-x-2 text-white"
          style={{ lineHeight: "1.5", marginBottom: "0.5rem" }}
        >
          <input
            type="checkbox"
            checked={filterByAuthor}
            onChange={(e) => setFilterByAuthor(e.target.checked)}
            className="form-checkbox h-5 w-5 rounded border-[#3d3d3d] bg-[#2a2a2a] text-primary focus:border-transparent focus:ring-2 focus:ring-primary"
          />
          <span>Authored by Me</span>
        </label>
        <label
          className="flex items-center space-x-2 text-white"
          style={{ lineHeight: "1.5", marginBottom: "0.5rem" }}
        >
          <input
            type="checkbox"
            checked={filterByPublic}
            onChange={(e) => setFilterByPublic(e.target.checked)}
            className="form-checkbox h-5 w-5 rounded border-[#3d3d3d] bg-[#2a2a2a] text-primary focus:border-transparent focus:ring-2 focus:ring-primary"
          />
          <span>Public Posts</span>
        </label>
      </div>

      <div className="mt-8 space-y-4">
        {filteredPosts.map((post) => (
          <PostCard
            key={post.postid}
            post={post}
            setPosts={setPosts}
            setEditingPost={setEditingPost}
            availableRoles={availableRoles}
            availableMemberships={availableMemberships}
            canEdit={canEdit}
            canDelete={canDelete}
            organizationId={organizationId}
          />
        ))}
      </div>
    </div>
  );
};

const PostCard: React.FC<{
  post: Posts;
  setPosts: React.Dispatch<React.SetStateAction<Posts[]>>;
  setEditingPost: React.Dispatch<React.SetStateAction<Posts | null>>;
  availableRoles: { id: string; name: string }[];
  availableMemberships: { membershipid: string; name: string }[];
  canEdit: boolean;
  canDelete: boolean;
  organizationId: string;
}> = memo(
  ({
    post,
    setPosts,
    setEditingPost,
    availableRoles,
    availableMemberships,
    canEdit,
    canDelete,
    organizationId,
  }) => {
    const { content, authorid, postphotos, postid, createdat } = post;
    const [authorDetails, setAuthorDetails] = useState<{
      firstName: string;
      lastName: string;
      profilePicture: string | null;
    }>({
      firstName: "",
      lastName: "",
      profilePicture: null,
    });
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(true);

    const { user } = useUser();
    const [isCurrentUserAuthor, setIsCurrentUserAuthor] = useState(false);

    const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;

    useEffect(() => {
      const fetchPostPrivacy = async () => {
        setIsLoadingPrivacy(true);
        const roles = await fetchPostRoles(postid);
        const memberships = await fetchPostMemberships(postid);
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

      if (user && user.id === authorid) {
        setIsCurrentUserAuthor(true);
      }
    }, [authorid, postid, user, post]);

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
      if (!canEdit) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "You do not have permission to edit posts.",
        });
        return;
      }

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
        .filter((name) => name);

      setEditingPost({
        ...post,
        selectedRoles: roleNames,
        selectedMemberships: membershipNames.length > 0 ? membershipNames : [],
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

      if (roleLabels.length > 0 || membershipLabels.length > 0) {
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

    const galleryImages = (postphotos ?? []).map((photo) => ({
      original: photo,
      thumbnail: photo,
    }));

    return (
      <div className="relative rounded-lg bg-[#171717] p-4 shadow-lg">
        {isCurrentUserAuthor && (
          <div className="absolute right-2 top-2 flex items-center space-x-2">
            <button className="text-gray-500 hover:text-gray-400" onClick={handleEdit}>
              <PencilIcon className="h-4 w-4" />
            </button>
            <button className="text-gray-500 hover:text-gray-400" onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" />
            </button>
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
              {createdat ? format(new Date(createdat), "MMMM dd, yyyy") : "Unknown date"}
            </p>
            <div className="flex space-x-2">{generatePrivacyLabel()}</div>
          </div>
        </div>
        <p className="mb-5 mt-5 break-words rounded-lg bg-[#2a2a2a] p-4 text-white">
          {content}
        </p>

        {postphotos && postphotos.length > 0 && (
          <div className="mt-5">
            <ImageGallery items={galleryImages} showPlayButton={false} />
          </div>
        )}
        <div className="mt-4"></div>

        <CommentsSection postId={postid} organizationId={organizationId} />
      </div>
    );
  }
);

export default PostsSection;
