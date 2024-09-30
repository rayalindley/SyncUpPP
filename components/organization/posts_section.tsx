"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PhotoIcon,
  XCircleIcon,
  UserCircleIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Switch, Menu, Transition } from "@headlessui/react";
import { useUser } from "@/context/user_context";
import {
  insertPost,
  updatePost,
  fetchRolesAndMemberships,
  deletePost,
  check_permissions,
  getVisiblePostsAndComments,
} from "@/lib/posts_tab";
import { Posts } from "@/types/posts";
import TagsInput from "../custom/tags-input";
import CommentsSection from "./comments_section";
import Swal from "sweetalert2";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { SupabaseClient } from "@supabase/supabase-js";

const postSchema = z.object({
  content: z.string().min(1, "Content is required").max(500),
  selectedRoles: z.array(z.string()).optional(),
  selectedMemberships: z.array(z.string()).optional(),
});

interface PostsSectionProps {
  organizationId: string;
  initialPosts: Posts[];
}

const PostsSection: React.FC<PostsSectionProps> = ({
  organizationId,
  initialPosts,
}) => {
  const { user } = useUser();
  const [currentPosts, setCurrentPosts] = useState<Posts[]>(initialPosts);

  const [editingPost, setEditingPost] = useState<Posts | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<
    { id: string; name: string }[]
  >([]);
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
  const [canCreate, setCanCreate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const supabase = createClient();
  const { register, handleSubmit, control, setValue, reset, watch } = useForm({
    resolver: zodResolver(postSchema),
  });

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;
  const isLoggedIn = user && user.id && user.id.length > 0;

  const formRef = useRef<HTMLDivElement>(null);

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
      setCanCreate(false);
      setCanDelete(false);
    }
  }, [isLoggedIn, user?.id, organizationId]);

  const fetchData = useCallback(async () => {
    const rolesAndMemberships = await fetchRolesAndMemberships(organizationId);
    if (rolesAndMemberships && rolesAndMemberships.error) {
      setCreationMessage({ text: rolesAndMemberships.error, type: "error" });
    } else if (rolesAndMemberships) {
      const fetchedRoles = rolesAndMemberships.roles.map((role: any) => ({
        id: role.id,
        name: role.name,
      }));
      const fetchedMemberships = rolesAndMemberships.memberships.map(
        (membership: any) => ({
          membershipid: membership.membershipid,
          name: membership.name,
        })
      );
      setAvailableRoles(fetchedRoles);
      setAvailableMemberships(fetchedMemberships);
    }
  }, [organizationId]);

  const loadPosts = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    const { data, error } = await getVisiblePostsAndComments(
      user?.id ?? null,
      organizationId
    );
    if (data) {
      setCurrentPosts(data);
    }
    if (error) {
      // Handle error if necessary
    }
  }, [user?.id, organizationId]);

  useEffect(() => {
    fetchData();
    fetchPermissions();

    // Set up real-time subscriptions
    const postsChannel = supabase
      .channel("posts-and-privacy")
      // Subscribe to changes in the 'posts' table
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `organizationid=eq.${organizationId}`,
        },
        async (payload) => {
          await loadPosts();
        }
      )
      // Subscribe to changes in the 'role_privacy' table
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "role_privacy",
          filter: `organizationid=eq.${organizationId}`,
        },
        async (payload) => {
          await loadPosts();
        }
      )
      // Subscribe to changes in the 'membership_privacy' table
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "membership_privacy",
          filter: `organizationid=eq.${organizationId}`,
        },
        async (payload) => {
          await loadPosts();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [fetchData, fetchPermissions, organizationId, user?.id, supabase, loadPosts]);

  // Scroll to form when editingPost is set
  useEffect(() => {
    if (editingPost && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // Optionally, focus the textarea for better UX
      const textarea = formRef.current.querySelector("textarea");
      if (textarea) {
        (textarea as HTMLElement).focus();
      }
    }
  }, [editingPost]);

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
      const fileName = `post_${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const { data: uploadResult, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, file);
      if (uploadResult) {
        const imageUrl = `${supabaseStorageBaseUrl}/post-images/${uploadResult.path}`;
        uploadedUrls.push(imageUrl);
      } else {
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
    setIsFormOpen(false);
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
        ? (editingPost.postphotos || []).filter(
            (photo) => !removedPhotos.includes(photo)
          )
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
        // Fetch posts immediately to ensure data integrity
        await loadPosts();
      } else {
        setCreationMessage({ text: "Failed to save post", type: "error" });
      }
    } catch (error) {
      setCreationMessage({
        text: "An unexpected error occurred while saving the post.",
        type: "error",
      });
    }
    setIsLoading(false);
    setTimeout(() => setCreationMessage(null), 3000);
  };

  useEffect(() => {
    if (editingPost) {
      setIsFormOpen(true);
      setValue("content", editingPost.content);
      setPhotos(editingPost.postphotos || []);
      setValue("selectedRoles", editingPost.selectedRoles || []);
      setValue("selectedMemberships", editingPost.selectedMemberships || []);
      setIsPublic(
        !editingPost.selectedRoles?.length && !editingPost.selectedMemberships?.length
      );
    }
  }, [editingPost, setValue]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo));
    };
  }, [photos]);

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mb-5 w-full text-center">
        <p className="mt-2 w-full text-2xl font-bold tracking-tight text-light sm:text-2xl">
          Posts Section
        </p>
      </div>
      {isLoggedIn && canCreate && (
        <>
          {!isFormOpen ? (
            // Compact form
            <div
              onClick={() => setIsFormOpen(true)}
              className="flex cursor-pointer items-center space-x-4 rounded-lg bg-[#3b3b3b] p-4 hover:bg-[#4b4b4b]"
            >
              <div className="flex-shrink-0">
                {user.profilepicture ? (
                  <img
                    src={user.profilepicture}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-white" />
                )}
              </div>
              <div className="w-full">
                <input
                  type="text"
                  placeholder="What's on your mind?"
                  className="w-full cursor-pointer rounded-full bg-[#4b4b4b] px-4 py-2 text-white focus:outline-none"
                  readOnly
                />
              </div>
            </div>
          ) : (
            // Full form
            <div
              ref={formRef}
              className="mt-4 rounded-lg bg-[#3b3b3b] p-4 shadow-lg"
            >
              <form id="post-form" onSubmit={handleSubmit(onSubmit)}>
                {/* Top row: User avatar and content input */}
                <div className="flex space-x-4">
                  <div className="flex-shrink-0">
                    {user.profilepicture ? (
                      <img
                        src={user.profilepicture}
                        alt="Profile"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-10 w-10 text-white" />
                    )}
                  </div>
                  <div className="w-full">
                    <textarea
                      {...register("content")}
                      className="w-full resize-none rounded-lg bg-[#171717] px-4 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="What's on your mind?"
                      maxLength={500}
                      disabled={isLoading}
                      rows={3}
                    />
                    <div className="text-right text-xs text-gray-400">
                      {watch("content")?.length || 0}/500
                    </div>
                  </div>
                </div>

                {/* Privacy options */}
                <div className="mt-2">
                  {/* Public switch */}
                  <div className="flex items-center space-x-2">
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
                        isPublic ? "bg-blue-500" : "bg-gray-600"
                      } relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 focus:outline-none`}
                    >
                      <span
                        className={`${
                          isPublic ? "translate-x-5" : "translate-x-1"
                        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300`}
                      />
                    </Switch>
                    <span className="text-sm text-white">
                      {isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                  {!isPublic && (
                    <div className="mt-2 space-y-2">
                      {/* Selected Roles */}
                      <Controller
                        name="selectedRoles"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                          <TagsInput
                            value={field.value}
                            onChange={(tags) => {
                              field.onChange(tags);
                            }}
                            suggestions={availableRoles.map((role) => role.name)}
                            placeholder="Select roles"
                            className="w-full rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        )}
                      />
                      {/* Selected Memberships */}
                      <Controller
                        name="selectedMemberships"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                          <TagsInput
                            value={field.value}
                            onChange={(tags) => {
                              field.onChange(tags);
                            }}
                            suggestions={availableMemberships.map(
                              (membership) => membership.name
                            )}
                            placeholder="Select memberships"
                            className="w-full rounded-lg border border-[#3d3d3d] bg-[#2a2a2a] px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Attachments and actions */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex space-x-2">
                    {/* Photo upload */}
                    <label
                      htmlFor="file-input"
                      className="flex cursor-pointer items-center space-x-1 text-white"
                    >
                      <PhotoIcon className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Photo/Video</span>
                      <input
                        type="file"
                        accept="image/*"
                        id="file-input"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="text-sm text-gray-400 hover:text-gray-200"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white ${
                        isLoading || !watch("content")?.trim()
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-primarydark"
                      }`}
                      disabled={isLoading || !watch("content")?.trim()}
                    >
                      {isLoading ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>

                {/* Photo previews */}
                {photos.length > 0 && (
  <div className="mt-4 grid grid-cols-3 gap-2">
    {photos.map((photo, index) => (
      <div
        key={index}
        className="relative bg-black h-40 w-full flex items-center justify-center overflow-hidden rounded-md"
      >
        <img
          src={photo}
          alt={`Attachment ${index + 1}`}
          className="max-h-full max-w-full object-contain"
        />
        <button
          type="button"
          onClick={() =>
            handleRemovePhoto(
              index,
              !!(editingPost && editingPost.postphotos?.includes(photo))
            )
          }
          className="absolute right-1 top-1 rounded-full bg-black bg-opacity-50 p-1 text-white hover:bg-opacity-75"
        >
          <XCircleIcon className="h-4 w-4" />
        </button>
      </div>
    ))}
  </div>
)}


                {/* Creation message */}
                {creationMessage && (
                  <div
                    className={`mt-3 rounded-md px-4 py-2 text-center text-sm font-medium ${
                      creationMessage.type === "success"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {creationMessage.text}
                  </div>
                )}
              </form>
            </div>
          )}
        </>
      )}

      <div className="mt-8 space-y-4">
        {currentPosts.map((post) => (
          <PostCard
            key={post.postid}
            post={post}
            setPosts={setCurrentPosts}
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
}> = ({
  post,
  setPosts,
  setEditingPost,
  availableRoles,
  availableMemberships,
  canDelete,
  organizationId,
}) => {
  const { content, authorid, postphotos, postid, createdat } = post;
  const authorDetails = {
    firstName: post.author_details.first_name,
    lastName: post.author_details.last_name,
    profilePicture: post.author_details.profile_picture
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${post.author_details.profile_picture}`
      : null,
  };

  // Compute selectedRoles and selectedMemberships directly from post prop
  const selectedRoles = post.privacy.role_privacy?.map((role: any) => role.role_id) || [];
  const selectedMemberships =
    post.privacy.membership_privacy?.map((membership: any) => membership.membership_id) ||
    [];

  const [isDeleted, setIsDeleted] = useState(false);
  const isLoadingPrivacy = false; // Privacy data is already loaded
  const { user } = useUser();
  const isLoggedIn = user && user.id && user.id.length > 0;
  const isCurrentUserAuthor = user?.id === authorid;

  const handleDelete = () => {
    if (!canDelete && !isCurrentUserAuthor) {
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
          if (postid && authorid) {
            const { error } = await deletePost(postid, authorid);
            if (!error) {
              setIsDeleted(true);
              setTimeout(
                () =>
                  setPosts((prevPosts) => prevPosts.filter((p) => p.postid !== postid)),
                3000
              );
            } else {
              Swal.fire({
                icon: "error",
                title: "Deletion Failed",
                text: "Unable to delete post. Please try again.",
              });
            }
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Deletion Error",
            text: "An error occurred while deleting the post.",
          });
        }
      }
    });
  };

  const handleEdit = () => {
    const roleNames: string[] = selectedRoles.map(
      (roleId: string): string =>
        availableRoles.find((role: { id: string; name: string }) => role.id === roleId)
          ?.name || ""
    );
    const membershipNames: string[] = selectedMemberships
      .map(
        (membershipId: string): string =>
          availableMemberships.find(
            (membership: { membershipid: string; name: string }) =>
              membership.membershipid === membershipId
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
    const roleLabels = selectedRoles.map((roleId: string) => {
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
    const membershipLabels = selectedMemberships.map((membershipId: string) => {
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
        <div className="absolute right-2 top-2">
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center text-gray-500 hover:text-gray-400">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {isCurrentUserAuthor && (
                  <div className="p-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleEdit}
                          className={`${
                            active ? "bg-gray-100" : ""
                          } group flex w-full items-center rounded-md p-2 text-sm text-gray-900`}
                        >
                          <PencilIcon className="mr-2 h-5 w-5 text-gray-400" />
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                )}
                {(isCurrentUserAuthor || canDelete) && (
                  <div className="p-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleDelete}
                          className={`${
                            active ? "bg-gray-100" : ""
                          } group flex w-full items-center rounded-md p-2 text-sm text-gray-900`}
                        >
                          <TrashIcon className="mr-2 h-5 w-5 text-gray-400" />
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                )}
              </Menu.Items>
            </Transition>
          </Menu>
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
          <ImageGallery
            items={galleryImages}
            showNav={true}
            showThumbnails={false}
            showBullets={true}
            showIndex={true}
            showFullscreenButton={false}
            showPlayButton={false}
          />
        </div>
      )}
      <CommentsSection
        postId={postid ?? ""}
        organizationId={organizationId}
        comments={post.comments}
      />
    </div>
  );
};
PostCard.displayName = "PostCard";
export default PostsSection;
