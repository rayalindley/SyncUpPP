import { useEffect, useState, Fragment } from "react";
import { useParams } from "next/navigation";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Listbox, Transition } from "@headlessui/react";
import { PaperClipIcon, GlobeAltIcon, LockClosedIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";
import { fetchOrganizationBySlug } from "@/lib/organization";
import { insertPost } from "@/lib/posts";
import { getUser } from "@/lib/supabase/client"; // Import your server function

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

export default function Example() {
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

  useEffect(() => {
    const fetchUserAndOrganization = async () => {
      try {
        const userData = await getUser(); // Fetch user data from the server
        if (userData && userData.user) {
          console.log("User data:", userData.user);
          setUserId(userData.user.id);
        } else {
          setUserId(null);
        }

        const { data, error } = await fetchOrganizationBySlug(slug);
        if (error) {
          console.error(error);
        } else {
          setOrganization(data);
          console.log("Organization data:", data);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    if (slug) {
      fetchUserAndOrganization();
    }
  }, [slug]);

  if (!organization) {
    return <div>Loading...</div>;
  }

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

      if (!organization.organizationid) {
        throw new Error("Organization ID not found");
      }

      if (!userId) {
        throw new Error("User not logged in");
      }

      const postData = {
        ...formData,
        organizationid: organization.organizationid,
        authorid: userId,
        postphoto: photo,
      };

      const { data: postResponse, error } = await insertPost(
        postData,
        organization.organizationid
      );

      if (!error) {
        console.log("Post created successfully:", postResponse);
        reset();
        setPhoto(null);
      } else {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error creating post:", error.message);
      toast.error("Failed to create post. Please try again later.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      <div className="overflow-hidden rounded-lg shadow-sm">
        <label htmlFor="content" className="sr-only">
          Description
        </label>
        <textarea
          rows={2}
          id="content"
          {...register("content")}
          className="block w-full resize-none border-0 py-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
          placeholder="Write a post..."
        />
        {errors.content && <p className="text-red-600">{errors.content.message}</p>}

        <div aria-hidden="true">
          <div className="py-2">
            <div className="h-9" />
          </div>
          <div className="h-px" />
          <div className="py-2">
            <div className="py-px">
              <div className="h-9" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-px bottom-0">
        <div className="flex flex-nowrap justify-end space-x-2 px-2 py-2 sm:px-3">
          <input
            type="file"
            accept="image/*"
            id="file-input"
            onChange={handleFileChange}
            className="hidden"
          />

          <label
            htmlFor="file-input"
            className="group -my-2 -ml-2 inline-flex cursor-pointer items-center rounded-full px-3 py-2 text-left text-gray-400"
          >
            <PaperClipIcon
              className="-ml-1 mr-2 h-5 w-5 group-hover:text-gray-500"
              aria-hidden="true"
            />
            <span className="text-sm italic text-gray-500 group-hover:text-gray-600">
              Attach an image...
            </span>
          </label>
        </div>
        <div className="flex items-center justify-between space-x-3 border-t border-gray-200 px-2 py-2 sm:px-3">
          <Controller
            name="privacyLevel"
            control={control}
            defaultValue={privacyLevels[0].value}
            render={({ field }) => (
              <Listbox
                as="div"
                value={privacyLevels.find((level) => level.value === field.value)}
                onChange={(val) => field.onChange(val.value)}
                className="flex-shrink-0"
              >
                {({ open }) => (
                  <>
                    <Listbox.Label className="sr-only">
                      Select Privacy Level
                    </Listbox.Label>
                    <div className="relative">
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
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {privacyLevels.map((level) => (
                            <Listbox.Option
                              key={level.value}
                              className={({ active }) =>
                                classNames(
                                  active ? "bg-gray-100" : "bg-white",
                                  "relative cursor-default select-none px-3 py-2"
                                )
                              }
                              value={level}
                            >
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
                                <span className="ml-3 block truncate font-medium">
                                  {level.name}
                                </span>
                              </div>
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </>
                )}
              </Listbox>
            )}
          />
        </div>
        <div className="flex items-center justify-between space-x-3 border-t border-gray-200 px-2 py-2 sm:px-3">
          <div className="flex">
            <button
              type="button"
              className="group -my-2 -ml-2 inline-flex items-center rounded-full px-3 py-2 text-left text-gray-400"
            >
              <PaperClipIcon
                className="-ml-1 mr-2 h-5 w-5 group-hover:text-gray-500"
                aria-hidden="true"
              />
              <span className="text-sm italic text-gray-500 group-hover:text-gray-600">
                Attach an image...
              </span>
            </button>
          </div>
          <div className="flex-shrink-0">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              disabled={isLoading}
            >
              {isLoading ? "Uploading..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
