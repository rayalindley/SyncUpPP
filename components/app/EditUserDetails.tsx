import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/lib/types";
import {
  deleteUser,
  getUserEmailById,
  getUserProfileById,
  sendPasswordRecovery,
  updateUserProfileById,
} from "@/lib/userActions";
import { isDateValid } from "@/lib/utils";
import { EnvelopeIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import Datepicker from "tailwind-datepicker-react";
import { z } from "zod";
import { adjustDate } from "@/lib/utils";

const supabase = createClient();

const UserProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.string().refine((val) => val === "M" || val === "F", {
    message: "Gender must be 'M' or 'F'",
  }),
  dateofbirth: z.string().refine(isDateValid, {
    message: "Invalid or underage date of birth",
  }),
  description: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url("Invalid URL format").optional(),
});

const EditUserDetails: React.FC<{ userId: string }> = ({ userId }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [email, setEmail] = useState("");
  const [imageError, setImageError] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { user } = useUser();
  const [show, setShow] = useState<boolean>(false);

  const datepickerOptions = {
    title: "Calendar",
    autoHide: true,
    clearBtn: true,
    maxDate: new Date(),
    theme: {
      background: "bg-[#158A70]",
      text: "text-white",
      todayBtn: "",
      clearBtn: "",
      icons: "",
      disabledText: "text-grey hover:bg-none",
      input:
        "block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6",
      inputIcon: "",
      selected: "bg-primary",
    },
    datepickerClassNames: "top-50",
    language: "en",
    weekDays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    inputNameProp: "date",
    inputIdProp: "date",
    inputPlaceholderProp: "Select Date",
    inputDateFormatProp: {
      day: "2-digit" as "2-digit" | "numeric" | undefined,
      month: "2-digit" as "2-digit" | "numeric" | "long" | "short" | "narrow" | undefined,
      year: "numeric" as "2-digit" | "numeric" | undefined,
    },
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<UserProfile>({
    resolver: zodResolver(UserProfileSchema),
  });

  const watchedFields = watch();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const response = await getUserProfileById(userId);
      if (response?.data) {
        setUserProfile(response.data);
        setPreviewUrl(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${response.data.profilepicture}`
        );
      }
    };

    const fetchEmail = async () => {
      const response = await getUserEmailById(userId);
      setEmail(response?.data?.email || "");
    };

    fetchUserProfile();
    fetchEmail();
  }, [userId]);

  const handleEdit = async (data: UserProfile) => {
    setIsUpdating(true);

    let profilePictureUrl = userProfile?.profilepicture;

    if (profilePictureFile) {
      const fileName = `${userProfile?.first_name}_${userProfile?.last_name}_${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: uploadResult, error } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, profilePictureFile);

      if (uploadResult) {
        profilePictureUrl = `profile-pictures/${uploadResult.path}`;
      } else {
        console.error("Error uploading image:", error);
        toast.error("Error uploading image. Please try again.");
        setIsUpdating(false);
        return;
      }
    }

    const updatedData: UserProfile = {
      ...data,
      userid: userProfile?.userid || "",
      updatedat: new Date(),
      profilepicture: profilePictureUrl,
    };

    const response = await updateUserProfileById(userProfile?.userid || "", updatedData);

    if (!response) {
      Swal.fire("Error", "Error updating user profile.", "error");
    } else {
      toast.success("User profile updated successfully", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: () => {
          window.history.back();
        },
      });
    }
    setIsUpdating(false);
  };

  const deleteBtn = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const response = await deleteUser(userId);

        if (!response.error) {
          Swal.fire({
            title: "Deleted!",
            text: "The user successfully deleted.",
            icon: "success",
          }).then(() => {
            location.reload();
          });
        } else {
          Swal.fire({
            title: "Failed!",
            text: response.error.message,
            icon: "error",
          });
        }
      }
    });
  };

  const handleSendPasswordRecovery = async () => {
    const response = await sendPasswordRecovery(email);

    if (!response.error) {
      Swal.fire("Email Sent!", "The password recovery email has been sent.", "success");
    } else {
      Swal.fire("Failed!", response.error.message, "error");
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setImageError("Please upload an image file");
        return;
      }

      setProfilePictureFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageError("");
    }
  };

  if (!userProfile) {
    return <div className="mt-10 text-light">Loading...</div>;
  }

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className="mx-auto max-w-lg p-6 shadow sm:rounded-lg">
        <form onSubmit={handleSubmit(handleEdit)} className="grid gap-4 px-4 py-5">
          <div className="col-span-3 text-center sm:col-span-2">
            <div className="relative inline-block">
              <div className="relative mx-auto h-44 w-44">
                <img
                  src={
                    previewUrl ||
                    (userProfile?.profilepicture &&
                      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${userProfile.profilepicture}`) ||
                    "/Portrait_Placeholder.png"
                  }
                  alt="Profile Picture"
                  className="block h-full w-full rounded-full border-4 border-primary object-cover"
                />
                <label
                  htmlFor="profile-picture-input"
                  className="absolute bottom-0 right-0 mb-2 mr-2"
                >
                  <PlusIcon className="h-8 w-8 cursor-pointer rounded-full border-2 border-primary bg-white text-primarydark" />
                </label>
              </div>
              <input
                id="profile-picture-input"
                accept="image/*"
                type="file"
                onChange={handleProfilePictureChange}
                className="hidden"
                title="Profile Picture"
              />
            </div>
            <p className="text-red-500">{imageError}</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="w-full">
                <label className="block text-sm font-medium text-light">
                  First Name*
                  <input
                    type="text"
                    {...register("first_name")}
                    defaultValue={userProfile.first_name}
                    className="mt-1 block w-full rounded-md border bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  />
                  <p className="text-red-500">{errors.first_name?.message}</p>
                </label>
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-light">
                  Last Name*
                  <input
                    type="text"
                    {...register("last_name")}
                    defaultValue={userProfile.last_name}
                    className="mt-1 block w-full rounded-md border bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  />
                  <p className="text-red-500">{errors.last_name?.message}</p>
                </label>
              </div>
            </div>

            <label className="block text-sm font-medium text-light">
              Gender*
              <select
                {...register("gender")}
                defaultValue={userProfile.gender || ""}
                className="mt-1 block w-full rounded-md border bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              >
                <option value="" disabled>
                  Select a gender
                </option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
              <p className="text-red-500">{errors.gender?.message}</p>
            </label>

            <label className="block text-sm font-medium text-light">
              Date of Birth*
              <Controller
                name="dateofbirth"
                control={control}
                rules={{ required: "Date of Birth is required" }}
                defaultValue={adjustDate(userProfile.dateofbirth || "")}
                render={({ field }) => (
                  <Datepicker
                    value={field.value ? new Date(field.value) : undefined}
                    options={datepickerOptions}
                    onChange={(selectedDate) => {
                      const adjustedDate = new Date(selectedDate);
                      adjustedDate.setMinutes(
                        adjustedDate.getMinutes() - adjustedDate.getTimezoneOffset()
                      );
                      const formattedDate = adjustedDate.toISOString().split("T")[0];
                      field.onChange(formattedDate);
                    }}
                    show={show}
                    setShow={setShow}
                  />
                )}
              />
              <p className="text-red-500">{errors.dateofbirth?.message}</p>
            </label>

            <label className="block text-sm font-medium text-light">
              Description
              <textarea
                {...register("description")}
                defaultValue={userProfile.description}
                className="mt-1 block w-full rounded-md border bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              />
              <p className="text-red-500">{errors.description?.message}</p>
            </label>

            <label className="block text-sm font-medium text-light">
              Company
              <input
                type="text"
                {...register("company")}
                defaultValue={userProfile.company}
                className="mt-1 block w-full rounded-md border bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              />
              <p className="text-red-500">{errors.company?.message}</p>
            </label>

            <label className="block text-sm font-medium text-light">
              Website
              <input
                type="text"
                {...register("website")}
                defaultValue={userProfile.website}
                placeholder="https://www.example.com"
                className="mt-1 block w-full rounded-md border bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              />
              <p className="text-red-500">{errors.website?.message}</p>
            </label>

            <button
              type="submit"
              className="w-full rounded-md border bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primarydark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating Profile" : "Update Profile"}
            </button>

            <button
              type="button"
              onClick={handleSendPasswordRecovery}
              className="mt-5 w-full rounded-md border bg-charleston px-4 py-2 text-sm font-medium text-light shadow-sm hover:bg-[#404040] focus:outline-none focus:ring-2 focus:ring-[#525252] focus:ring-offset-2"
            >
              <div className="flex items-center justify-center">
                <EnvelopeIcon className="mr-2 h-5 w-5" />
                <span>Send Password Recovery</span>
              </div>
            </button>

            {user && user.id !== userId && (
              <button
                type="button"
                onClick={deleteBtn}
                className="mt-5 w-full rounded-md border bg-charleston px-4 py-2 text-sm font-medium text-light shadow-sm hover:bg-[#404040] focus:outline-none focus:ring-2 focus:ring-[#525252] focus:ring-offset-2"
              >
                <TrashIcon className="mr-2 h-5 w-5" />
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default EditUserDetails;
