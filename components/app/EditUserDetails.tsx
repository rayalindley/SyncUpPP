"use client";
import { UserProfile } from "@/lib/types";
import {
  getUserEmailById,
  getUserProfileById,
  updateUserProfileById,
} from "@/lib/userActions";
import { convertToBase64, isValidURL } from "@/lib/utils";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Swal from "sweetalert2";

interface EditUserDetailsProps {
  userId: string;
}

const UserProfileSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  gender: z.string(),
  dateofbirth: z.string(),
  description: z.string(),
  company: z.string(),
  website: z.string().refine((value) => value === "" || isValidURL(value), {
    message: "Invalid URL format",
  }),
});

const EditUserDetails: React.FC<EditUserDetailsProps> = ({ userId = null }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [email, setEmail] = useState("");

  let completeButtonRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserProfile>({
    resolver: zodResolver(UserProfileSchema),
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response: any = await getUserProfileById(userId);
      setUserProfile(response?.data);
    };

    const fetchEmail = async () => {
      const response: any = await getUserEmailById(userId);
      setEmail(response?.data?.email);
    };

    fetchUserProfile();
    fetchEmail();
  }, [userId]);

  const handleEdit = async (data: UserProfile) => {
    setIsUpdating(true); // Start updating

    const updatedData: UserProfile = {
      ...data,
      userid: userProfile?.userid || "",
      updatedat: new Date(),
      dateofbirth: data.dateofbirth ? data.dateofbirth : undefined,
      profilepicture: userProfile?.profilepicture
        ? userProfile.profilepicture
        : undefined,
    };

    const response = await updateUserProfileById(userProfile?.userid || "", updatedData);

    if (response === null) {
      setDialogMessage("Error updating user profile.");
    } else {
      setDialogMessage("User profile updated successfully");
    }
    setIsOpen(true);

    //reload the top header to show updated name and profile pic

    setIsUpdating(false); // End updating
  };

  if (!userProfile) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="overflow-hidden bg-raisinblack p-6 shadow sm:rounded-lg">
      <div className="px-4 pb-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-light">Edit Profile</h3>
      </div>
      <div className="overflow-auto border-t border-[#525252] sm:h-auto">
        <form
          onSubmit={handleSubmit(handleEdit)}
          className="px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-6"
        >
          <div className="col-span-3 sm:col-span-2">
            <div className="flex items-center justify-center">
              <div className="relative">
                <img
                  src={
                    userProfile?.profilepicture
                      ? userProfile.profilepicture
                      : "/Portrait_Placeholder.png"
                  }
                  alt="Profile Picture"
                  className="block h-44 w-44 rounded-full border-4 border-primary"
                  style={{ objectFit: "cover" }}
                />
                <div className="absolute bottom-0 right-0 mb-2 mr-2">
                  <label htmlFor="file-input" className="">
                    <PlusIcon className="mr-2 inline-block h-8 w-8 cursor-pointer rounded-full border-2 border-primary  bg-white text-primarydark" />
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        const base64 = await convertToBase64(file);
                        setUserProfile({ ...userProfile, profilepicture: base64 });
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="mx-auto w-full space-y-4 sm:max-w-lg">
              <div className="mt-8 flex flex-row gap-2">
                <div className="w-full">
                  <label className="block text-sm font-medium text-light">
                    First Name
                    <input
                      type="text"
                      {...register("first_name")}
                      defaultValue={userProfile.first_name}
                      className=" mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                    />
                    {errors.first_name && <p>{errors.first_name.message}</p>}
                  </label>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-light">
                    Last Name
                    <input
                      type="text"
                      {...register("last_name")}
                      defaultValue={userProfile.last_name}
                      className="mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                    />
                    {errors.last_name && <p>{errors.last_name.message}</p>}
                  </label>
                </div>
              </div>
              <label className="mt-2 block text-sm font-medium text-light">
                Gender
                <select
                  {...register("gender")}
                  defaultValue={userProfile.gender || ""}
                  className="mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                >
                  <option value="" disabled={!!userProfile.gender}>
                    Select a gender
                  </option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                {errors.gender && <p>{errors.gender.message}</p>}
              </label>
              <label className="mt-2 block text-sm font-medium text-light">
                Date of Birth
                <input
                  type="date"
                  {...register("dateofbirth")}
                  defaultValue={userProfile.dateofbirth}
                  className="mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                />
                {errors.dateofbirth && <p>{errors.dateofbirth.message}</p>}
              </label>
              <label className="mt-2 block text-sm font-medium text-light">
                Description
                <textarea
                  {...register("description")}
                  defaultValue={userProfile.description}
                  className="mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                />
                {errors.description && <p>{errors.description.message}</p>}
              </label>
              <label className="mt-2 block text-sm font-medium text-light">
                Company
                <input
                  type="text"
                  {...register("company")}
                  defaultValue={userProfile.company}
                  className="mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                />
                {errors.company && <p>{errors.company.message}</p>}
              </label>
              <label className="mt-2 block text-sm font-medium text-light">
                Website
                <input
                  type="text"
                  {...register("website")}
                  defaultValue={userProfile.website}
                  placeholder="https://www.example.com"
                  className="mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                />
                {errors.website && <p>{errors.website.message}</p>}
              </label>

              <button
                type="submit"
                className="mt-10 flex w-full items-center justify-center rounded-md border border-primary border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primarydark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating Profile" : "Update Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          static
          className="fixed inset-0 z-10 overflow-y-auto"
          initialFocus={completeButtonRef}
          open={isOpen}
          onClose={setIsOpen}
        >
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-charleston bg-opacity-75 transition-opacity" />
            </Transition.Child>
            <span
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            >
              ​
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block transform overflow-hidden rounded-lg bg-raisinblack text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-raisinblack px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-light"
                      >
                        {dialogMessage}
                      </Dialog.Title>
                    </div>
                  </div>
                </div>
                <div className="bg-raisinblack px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primarydark focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsOpen(false)}
                    ref={completeButtonRef}
                  >
                    Close
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default EditUserDetails;
