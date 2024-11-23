"use client";

import { useState, useEffect, useCallback, Fragment, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PhotoIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  EllipsisVerticalIcon,
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
import { getUserProfileById } from "@/lib/user_actions"; // Add this import
import { CombinedUserData } from "@/types/combined_user_data";

const postSchema = z.object({
  content: z.string().min(1, "Content is required").max(500),
  selectedRoles: z.array(z.string()).optional(),
  selectedMemberships: z.array(z.string()).optional(),
});

interface PostsSectionProps {
  organizationId: string;
  initialPosts: Posts[];
}

const PostsSection: React.FC<PostsSectionProps> = ({ organizationId, initialPosts }) => {
  const { user } = useUser();
  const [currentPosts, setCurrentPosts] = useState<Posts[]>(initialPosts || []);

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
  const [filterByDate, setFilterByDate] = useState<Date | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<CombinedUserData | null>(null); // Add this line

  const supabase = createClient();
  const { register, handleSubmit, control, setValue, reset, watch } = useForm({
    resolver: zodResolver(postSchema),
  });

  const supabaseStorageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`;
  const isLoggedIn = user && user.id && user.id.length > 0;

  // Reference to the form container for scrolling
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

  // fetch permissions and data on mount
  useEffect(() => {
    fetchPermissions();
    fetchData();
  }, [fetchPermissions, fetchData]);

  useEffect(() => {
    const postsChannel = supabase
      .channel("posts-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          loadPosts();
        }
      )
      .subscribe();

    const rolePrivacyChannel = supabase
      .channel("role-privacy-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_roles" },
        (payload) => {
          loadPosts();
        }
      )
      .subscribe();

    const membershipPrivacyChannel = supabase
      .channel("membership-privacy-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_memberships" },
        (payload) => {
          loadPosts();
        }
      )
      .subscribe();
  }, [supabase, loadPosts, organizationId]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        if (user?.id) {
          const response = await getUserProfileById(user.id);
          setUserProfile(response.data as CombinedUserData);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

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
      const fileName = `post_${Date.now()}-${Math.random().toString(36).substring(7)}`;
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

  const filteredPosts = (currentPosts || [])
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
    <div className="mx-auto max-w-3xl  lg:px-8">
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
              className="flex items-center space-x-4 rounded-lg bg-[#171717] p-4 "
            >
              <div className="flex w-full items-center border-b border-gray-600">
                <PencilIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Let your organization know what's happening..."
                  className="w-full cursor-text border-transparent bg-transparent py-2 text-white focus:border-transparent focus:outline-none focus:ring-0"
                  readOnly
                />
              </div>
            </div>
          ) : (
            // Full form
            <div ref={formRef} className="mt-4 rounded-lg bg-[#171717] p-4 shadow-lg">
              <form id="post-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="w-full">
                  <div className="flex w-full items-center border-b border-gray-600">
                    <div className="w-full">
                      <div className="flex w-full items-center">
                        {!watch("content") && (
                          <PencilIcon className="mr-2 h-5 w-5 text-gray-400" />
                        )}
                        <textarea
                          placeholder="Let your organization know what's happening..."
                          className="w-full cursor-text resize-none overflow-hidden border-transparent bg-transparent py-2 text-white focus:border-transparent focus:outline-none focus:ring-0"
                          // limit content to 500 characters
                          maxLength={500}
                          rows={1}
                          {...register("content")}
                          onInput={(e) => {
                            e.currentTarget.style.height = "auto";
                            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                          }}
                        />
                      </div>
                      {/* Photo previews */}
                      {photos.length > 0 && (
                        <div className="mb-4 mt-4 grid w-full grid-cols-3 gap-2">
                          {photos.map((photo, index) => (
                            <div
                              key={index}
                              className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-md bg-black"
                            >
                              <img
                                src={photo}
                                alt={`Attachment ${index + 1}`}
                                className="h-auto max-h-40 w-auto max-w-full bg-black object-contain"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemovePhoto(
                                    index,
                                    !!(
                                      editingPost &&
                                      editingPost.postphotos?.includes(photo)
                                    )
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
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    {watch("content")?.length || 0}/500
                  </div>
                </div>

                {/* Privacy options */}
                <div className="mt-2 flex flex-wrap items-center space-x-4">
                  {/* Public switch */}
                  <div className="mb-2 flex w-full items-center space-x-2 sm:mb-0 sm:w-auto">
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
                    <div className="flex w-full flex-wrap gap-1 sm:flex-1 sm:flex-nowrap sm:gap-4">
                      {/* Selected Roles */}
                      <div className="mb-2 w-full sm:mb-0 sm:min-w-[150px] sm:flex-1">
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
                              placeholder="Roles"
                              allowCustomTags={false} // Disallow custom tags
                            />
                          )}
                        />
                      </div>
                      {/* Selected Memberships */}
                      <div className="w-full sm:min-w-[150px] sm:flex-1">
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
                              placeholder="Memberships"
                              allowCustomTags={false} // Disallow custom tags
                            />
                          )}
                        />
                      </div>
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
        {filteredPosts.length <= 0 && !isLoading && (
          <div
            className="mb-4 rounded-lg bg-gray-800 p-4 text-center text-sm text-blue-400"
            role="alert"
          >
            The organization has no posts available for you at the moment.
          </div>
        )}
        {filteredPosts.map((post) => (
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
        <span className="inline-block rounded-full border border-yellow-500 px-2 py-0.5 text-xs text-yellow-500">
          Loading...
        </span>
      );
    }

    const roleLabels = selectedRoles.map((roleId: string) => {
      const roleName = availableRoles.find((role) => role.id === roleId)?.name;
      return (
        <span
          key={roleId}
          className="inline-block rounded-full border border-blue-500 px-2 py-0.5 text-xs text-blue-500"
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
          className="inline-block rounded-full border border-purple-500 px-2 py-0.5 text-xs text-purple-500"
        >
          {membershipName}
        </span>
      );
    });

    if (roleLabels.length || membershipLabels.length) {
      return [...roleLabels, ...membershipLabels];
    }

    return (
      <span className="inline-block rounded-full border border-green-500 px-2 py-0.5 text-xs text-green-500">
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
      <div className="relative rounded-md bg-[#171717] shadow-sm">
        {isLoggedIn && (
          <div className="absolute right-2 top-2 flex space-x-2">
            <div className="flex flex-wrap">{generatePrivacyLabel()}</div>
            <Menu as="div" className="relative">
              <Menu.Button className="text-gray-400 hover:text-gray-300">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-36 rounded-md bg-charleston shadow-md ring-1 ring-black ring-opacity-5">
                  {isCurrentUserAuthor && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleEdit}
                          className={`flex w-full items-center rounded-md p-2 text-sm text-gray-300 ${
                            active ? "bg-gray-700" : ""
                          }`}
                        >
                          <PencilIcon className="mr-2 h-4 w-4" /> Edit
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  {(isCurrentUserAuthor || canDelete) && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleDelete}
                          className={`flex w-full items-center rounded-md p-2 text-sm text-gray-300 ${
                            active ? "bg-gray-700" : ""
                          }`}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" /> Delete
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#424242]">
            {authorDetails.profilePicture ? (
              <img
                src={authorDetails.profilePicture}
                alt={`${authorDetails.firstName}'s profile`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {authorDetails.firstName} {authorDetails.lastName}
            </span>
          </div>
        </div>

        <div className="mt-3 break-words rounded-md text-sm text-white">{content}</div>

        {galleryImages.length > 0 && (
          <div className="mt-3" style={{ maxHeight: "400px", overflow: "hidden" }}>
            <ImageGallery
              items={galleryImages}
              showNav={false}
              showPlayButton={false}
              showBullets={false}
              renderItem={(item) => (
                <div className="image-gallery-image" style={{ backgroundColor: "black" }}>
                  <img
                    src={item.original}
                    alt={item.originalAlt}
                    style={{
                      maxHeight: "300px",
                      width: "auto",
                      height: "auto",
                      margin: "0 auto",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
              renderThumbInner={(item) => (
                <div
                  className="image-gallery-thumbnail-inner"
                  style={{ backgroundColor: "black" }}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.thumbnailAlt}
                    style={{
                      maxHeight: "50px",
                      width: "auto",
                      height: "auto",
                      margin: "0 auto",
                    }}
                  />
                </div>
              )}
              onScreenChange={(isFullScreen) => {
                const galleryElement = document.querySelector(".image-gallery");
                if (galleryElement) {
                  const images = galleryElement.querySelectorAll(
                    ".image-gallery-image img"
                  );
                  if (isFullScreen) {
                    // Make the images fill the full screen while maintaining aspect ratio
                    images.forEach((img) => {
                      (img as HTMLElement).style.maxHeight = "100vh"; // Fill the full screen height
                      (img as HTMLElement).style.maxWidth = "100vw"; // Fill the full screen width
                      (img as HTMLElement).style.height = "100%"; // Set height to fill screen
                      (img as HTMLElement).style.width = "100%"; // Set width to fill screen
                      (img as HTMLElement).style.objectFit = "contain"; // Maintain aspect ratio
                    });
                  } else {
                    // Restore the limited height when exiting full-screen
                    images.forEach((img) => {
                      (img as HTMLElement).style.maxHeight = "300px"; // Reset to original max height
                      (img as HTMLElement).style.maxWidth = "100%"; // Reset width
                      (img as HTMLElement).style.height = "auto"; // Restore normal dimensions
                      (img as HTMLElement).style.width = "auto"; // Restore normal dimensions
                      (img as HTMLElement).style.objectFit = "contain"; // Maintain aspect ratio
                    });
                  }
                }
              }}
            />
          </div>
        )}

        <div className="mt-3 flex justify-between text-xs text-gray-700">
          <div>
            {createdat
              ? format(new Date(createdat), "MMM dd, yyyy hh:mm a")
              : "Unknown date"}
          </div>
        </div>
      </div>

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
