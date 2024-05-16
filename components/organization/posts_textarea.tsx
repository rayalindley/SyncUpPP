import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Listbox, Transition } from "@headlessui/react";
import {
  CameraIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UserCircleIcon,
  PhotoIcon,
} from "@heroicons/react/16/solid";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import { insertPost, updatePost } from "@/lib/posts";
import Divider from "./divider";

interface OrganizationFormValues {
  content: string;
  privacyLevel: string;
}

const postSchema = z.object({
  content: z.string().min(1, "Content is required"),
  privacyLevel: z.enum(["public", "private"]),
});

const privacyLevels = [
  { name: "Public", value: "public", icon: GlobeAltIcon },
  { name: "Private", value: "private", icon: LockClosedIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function PostsTextArea({ organizationid, postsData, setPostsData }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(postSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { slug } = useParams();
  const [isUpdate, setIsUpdate] = useState(false);
  const [existingPost, setExistingPost] = useState<any>(null);
  const [content, setContent] = useState<string>(""); // State to track textarea content
  const [accordionOpen, setAccordionOpen] = useState(false); // State to manage accordion open/close

  useEffect(() => {
    setAccordionOpen(false); // Initialize accordion state to closed when component mounts
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        console.error("Please upload an image file");
        return;
      }

      setIsLoading(true);

      const fileName = `post_${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: uploadResult, error } = await createClient()
        .storage.from("post-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult) {
        setPhoto(uploadResult.fullPath);
      } else {
        console.error("Error uploading image:", error);
      }

      setIsLoading(false);
    }
  };

  const onSubmit: SubmitHandler<OrganizationFormValues> = async (formData) => {
    try {
      setIsLoading(true);
      const postData = {
        ...formData,
        organizationid: organizationid,
        postphoto: photo,
      };

      let postResponse;
      let error;

      if (isUpdate && existingPost) {
        ({ data: postResponse, error } = await updatePost(postData));
      } else {
        ({ data: postResponse, error } = await insertPost(postData, organizationid));
      }

      if (!error) {
        setPostsData([postResponse, ...postsData]);
        setContent(""); // Clear the textarea value
        setPhoto(null);
        setIsUpdate(false);
        setExistingPost(null);
      } else {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error creating/updating post:", error.message);
      toast.error("Failed to create/update post. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update content state when textarea content changes
  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  // Toggle accordion open/close state
  const toggleAccordion = () => {
    setAccordionOpen(!accordionOpen);
    if (accordionOpen) {
      setAccordionOpen(true);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      <div className="max-h-6xl border-t border-[#525252] px-3 py-2"></div>
      <div className="rounded-lg">
        <label htmlFor="content" className="sr-only">
          Description
        </label>
        <div className="flex flex-row" onClick={toggleAccordion}>
          <div>
            <UserCircleIcon className="h-10 w-10 text-gray-500" aria-hidden="true" />
          </div>
          <div className="flex-grow">
            <textarea
              id="content"
              {...register("content")}
              className="min-h-4xl h-auto w-full resize-none overflow-hidden border-0 bg-[#1C1C1C] text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              style={{ caretColor: "white", color: "white" }} // Change text color to white
              placeholder="Write a post..."
              value={content}
              onChange={handleContentChange}
            />
          </div>
        </div>
        <div>
          <Transition
            show={accordionOpen}
            as={Fragment}
            enter="transition ease-out duration-300"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-200"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <div className="relative ml-8 mt-2 border-b border-[#525252] px-3 py-4">
              <Controller
                name="privacyLevel"
                control={control}
                defaultValue={privacyLevels[0].value}
                render={({ field }) => (
                  <Listbox
                    as="div"
                    value={privacyLevels.find((level) => level.value === field.value)}
                    onChange={(val) => field.onChange(val.value)}
                    className="mt-2"
                  >
                    {({ open }) => (
                      <>
                        <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3">
                          {field.value === "public" ? (
                            <GlobeAltIcon
                              className="h-5 w-5 text-gray-500"
                              aria-hidden="true"
                            />
                          ) : (
                            <LockClosedIcon
                              className="h-5 w-5 text-gray-500"
                              aria-hidden="true"
                            />
                          )}
                          <span className="hidden truncate sm:ml-2 sm:block">
                            {
                              privacyLevels.find((level) => level.value === field.value)
                                .name
                            }
                          </span>
                        </Listbox.Button>

                        <Transition
                          show={open}
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="opacity-0 scale-95"
                          enterTo="opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="opacity-100 scale-100"
                          leaveTo="opacity-0 scale-95"
                        >
                          <Listbox.Options
                            static
                            className="absolute left-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg border-b bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                          >
                            {privacyLevels.map((level) => (
                              <Listbox.Option
                                key={level.value}
                                className={({ active }) =>
                                  classNames(
                                    active ? "bg-gray-100" : "bg-white",
                                    "relative cursor-default select-none px-3 py-1"
                                  )
                                }
                                value={level}
                              >
                                {({ selected }) => (
                                  <div className="flex items-center">
                                    {level.icon === GlobeAltIcon ? (
                                      <GlobeAltIcon
                                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <LockClosedIcon
                                        className="h-5 w-5 flex-shrink-0 text-gray-400"
                                        aria-hidden="true"
                                      />
                                    )}
                                    <span className="ml-2 block truncate font-normal">
                                      {level.name}
                                    </span>
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </>
                    )}
                  </Listbox>
                )}
              />
            </div>
          </Transition>
        </div>

        <div className="mt-2 flex flex-row border-b border-[#525252]">
          {" "}
          {/* Adjust border-t-2 to your desired size */}
          <div>
            <input
              type="file"
              accept="image/*"
              id="file-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-input"
              className="group inline-flex cursor-pointer items-center rounded-full text-left text-gray-400"
            >
              <PhotoIcon
                className="ml-12 mt-4 h-6 w-6 text-gray-500 group-hover:text-gray-500"
                aria-hidden="true"
              />
            </label>
          </div>
          <div className="flex-grow" /> {/* This pushes the button to the right */}
          <div className="mb-2 rounded-md px-3">
            <div className="flex items-center justify-end space-x-3 border-gray-200 px-2 py-2 sm:px-3">
              <div className="flex-shrink-0">
                <button
                  type="submit"
                  className={`inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm ${
                    isLoading || !content.trim()
                      ? "bg-primarydark" // Apply greyed-out style and disable cursor
                      : "hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  }`}
                  disabled={isLoading || !content.trim()} // Disable button if content is empty
                >
                  {isLoading ? "Posting..." : isUpdate ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
