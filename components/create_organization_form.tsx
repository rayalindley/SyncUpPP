import { CameraIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Steps, useSteps } from "react-step-builder";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Datepicker from "tailwind-datepicker-react";
import { z } from "zod";

import { createOrganization, updateOrganization } from "@/lib/organization";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import countries from "@/lib/countries";
import { IOptions } from "tailwind-datepicker-react/types/Options";
import { recordActivity } from "@/lib/track";

// Define constants for types of organizations, industries, and sizes
const ORGANIZATION_TYPES = [
  "Nonprofit",
  "For-Profit",
  "Governmental",
  "Educational",
  "Partnership",
  "Corporation",
  "Sole Proprietorship",
  "Limited Liability Company (LLC)",
] as const;
const INDUSTRIES = [
  "Agriculture",
  "Automotive",
  "Education",
  "Energy",
  "Entertainment",
  "Finance",
  "Healthcare",
  "Hospitality",
  "Information Technology",
  "Manufacturing",
  "Retail",
  "Telecommunications",
  "Transportation",
  "Other",
] as const;
const ORGANIZATION_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
] as const;
const COUNTRIES = countries.map((x) => x.name) as [string, ...string[]];

interface OrganizationFormValues {
  name: string;
  slug: string;
  description: string;
  organizationType: string;
  industry: string;
  organizationSize: string;
  website: string;
  dateEstablished: Date;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  country: string;
  facebookLink?: string;
  twitterLink?: string;
  linkedinLink?: string;
  photo?: string;
  banner?: string;
  organizationAccess: "open" | "approval";
}

const OrganizationSchema = z.object({
  name: z.string().min(3, "Organization Name is required"),
  slug: z.string().min(3, "A valid slug is required"),
  description: z.string().min(3, "Description is required"),
  organizationType: z.enum(ORGANIZATION_TYPES, {
    errorMap: () => ({ message: "Invalid organization type" }),
  }),
  industry: z.enum(INDUSTRIES, { errorMap: () => ({ message: "Invalid industry" }) }),
  organizationSize: z.enum(ORGANIZATION_SIZES, {
    errorMap: () => ({ message: "Invalid organization size" }),
  }),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  dateEstablished: z.date(),
  addressLine1: z.string().min(3, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(3, "City is required"),
  stateProvince: z.string().min(3, "State / Province is required"),
  country: z.enum(COUNTRIES, { errorMap: () => ({ message: "Country is required" }) }),
  facebookLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
  twitterLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
  linkedinLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
  organizationAccess: z.enum(["open", "approval"], {
    errorMap: () => ({ message: "Please select an organization access type" }),
  }),
});
const datepicker_options: IOptions = {
  title: "Calendar",
  autoHide: true,
  todayBtn: true,
  clearBtn: true,
  clearBtnText: "Clear",
  maxDate: new Date(),
  theme: {
    background: "bg-[#158A70]",
    todayBtn: "",
    clearBtn: "",
    icons: "",
    text: "text-white",
    disabledText: "text-gray-600 hover:bg-none",
    input:
      "block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6",
    inputIcon: "",
    selected: "bg-primary",
  },
  datepickerClassNames: "top-50",
  defaultDate: null,
  language: "en",
  disabledDates: [],
  weekDays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  inputNameProp: "date",
  inputIdProp: "date",
  inputPlaceholderProp: "Select Date",
  inputDateFormatProp: {
    day: "numeric" as "numeric", // Ensure correct type casting
    month: "long" as "long", // Ensure correct type casting
    year: "numeric" as "numeric", // Ensure correct type casting
  },
};

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function checkSlugAvailability(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching slug:", error);
    return { isAvailable: false, error: error.message };
  }

  return { isAvailable: !data, error: null };
}

const CreateOrganizationForm = ({ formValues = null }: { formValues: any | null }) => {
  const [banner, setBanner] = useState(formValues?.banner || null);
  const [bannerError, setBannerError] = useState("");
  const [imageError, setImageError] = useState("");
  const { prev, next, jump, total, current, progress } = useSteps();
  const [formData, setFormData] = useState<OrganizationFormValues>(formValues);
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const getImageUrl = (path: string): string => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isValid },
    trigger,
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(OrganizationSchema),
    mode: "onChange",
  });

  const slugValue = watch("slug");
  useEffect(() => {
    if (formValues) {
      const dateEstablished = formValues.date_established
        ? new Date(formValues.date_established)
        : undefined;

      reset({
        name: formValues.name,
        slug: formValues.slug,
        description: formValues.description,
        organizationType: formValues.organization_type,
        industry: formValues.industry,
        organizationSize: formValues.organization_size,
        website: formValues.website,
        dateEstablished: dateEstablished,
        addressLine1: formValues.address.addressLine1,
        addressLine2: formValues.address.addressLine2,
        city: formValues.address.city,
        stateProvince: formValues.address.stateProvince,
        country: formValues.address.country,
        facebookLink: formValues.socials.facebook,
        twitterLink: formValues.socials.twitter,
        linkedinLink: formValues.socials.linkedin,
        organizationAccess: formValues.organization_access,
      });
      setPhoto(formValues.photo);
      setBanner(formValues.banner);
    }
  }, [formValues, reset]);
  useEffect(() => {
    if (formValues?.photo) {
      const photoUrl = getImageUrl(formValues.photo); // formValues.photo should be something like 'organization-photos/roooobooot_1715960210143-6wkzfn'
      setPhoto(photoUrl);
    }
    if (formValues?.banner) {
      const bannerUrl = getImageUrl(formValues.banner); // formValues.banner should be something like 'organization-banners/roooobooot_banner_1715960211482-e96lv5'
      setBanner(bannerUrl);
    }
  }, [formValues]);

  useEffect(() => {
    if (slugValue) {
      const timer = setTimeout(async () => {
        const { isAvailable, error } = await checkSlugAvailability(slugValue);

        if (error) {
          toast.error("Error checking slug availability");
          console.error("Error fetching slug:", error);
        } else if (!isAvailable && slugValue !== formValues?.slug) {
          setError("slug", { type: "manual", message: "Slug is already taken" });
        } else {
          clearErrors("slug");
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [slugValue, setError, clearErrors]);

  const handleNext = async () => {
    const currentStepId = `step${current}`;
    const fieldsInStep = document.querySelectorAll<HTMLInputElement>(
      `#${currentStepId} [name]`
    );
    const fieldNames = Array.from(fieldsInStep)
      .map((field) => field.getAttribute("name"))
      .filter((name): name is keyof OrganizationFormValues => name !== null);

    const result = await trigger(fieldNames);

    const slugValue = getValues("slug");
    const { isAvailable, error } = await checkSlugAvailability(slugValue);

    if (error) {
      toast.error("Error checking slug availability");
      console.error("Error fetching slug:", error);
      return;
    } else if (!isAvailable && slugValue !== formValues?.slug) {
      setError("slug", { type: "manual", message: "Slug is already taken" });
      toast.error("Slug is already taken. Please choose another.");
      return;
    } else {
      clearErrors("slug");
    }

    if (result && (isAvailable || slugValue === formValues?.slug)) {
      setFormData(getValues());
      next();
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: SubmitHandler<OrganizationFormValues> = async () => {
    setIsLoading(true);

    const formData = { ...getValues() };
    const supabase = createClient();

    try {
      // Ensure the slug is available before proceeding
      const { isAvailable, error: slugError } = await checkSlugAvailability(
        formData.slug
      );

      if (slugError) {
        toast.error("Error checking slug availability");
        console.error("Error fetching slug:", slugError);
        setIsLoading(false);
        return;
      }

      if (!isAvailable && formData.slug !== formValues?.slug) {
        setError("slug", { type: "manual", message: "Slug is already taken" });
        toast.error("Slug is already taken. Please choose another.");
        setIsLoading(false);
        return;
      }

      // Upload the photo if a file is selected
      if (photoFile) {
        const photoFileName = `${slugify(formData.name)}_${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { data: photoUploadResult, error: photoError } = await supabase.storage
          .from("organization-photos")
          .upload(photoFileName, photoFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (photoUploadResult) {
          formData.photo = `organization-photos/${photoUploadResult.path}`;
        } else {
          console.error("Error uploading image:", photoError);
          toast.error("Error uploading image. Please try again.");
          setIsLoading(false);
          return;
        }
      }

      // Upload the banner if a file is selected
      if (bannerFile) {
        const bannerFileName = `${slugify(formData.name)}_banner_${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { data: bannerUploadResult, error: bannerError } = await supabase.storage
          .from("organization-banners")
          .upload(bannerFileName, bannerFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (bannerUploadResult) {
          formData.banner = `organization-banners/${bannerUploadResult.path}`;
        } else {
          console.error("Error uploading banner:", bannerError);
          toast.error("Error uploading banner. Please try again.");
          setIsLoading(false);
          return;
        }
      }

      // Proceed with inserting or updating the organization
      if (formValues) {
        const { data, error } = await updateOrganization(
          formValues.organizationid,
          formData
        );

        if (data) {
        
          await recordActivity({
            activity_type: "organization_update",
            organization_id: data.organizationid,
            description: `${formData.name} details was updated`,
            activity_details: {
              organization_name: formData.name,
              organization_slug: formData.slug,
              organization_description: formData.description,
              organization_type: formData.organizationType,
              organization_industry: formData.industry,
              organization_size: formData.organizationSize,
            },
          });

          toast.success("Organization was updated successfully.", {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            onClose: () => router.back(),
          });
          reset();
        } else if (error) {
          throw error;
        }
      } else {
        const { data, error } = await createOrganization(formData);

        if (data) {

          // record activity
          await recordActivity({
            activity_type: "organization_create",
            organization_id: data.organizationid,
            description: `${formData.name} was created`,
            activity_details: {
              organization_name: formData.name,
              organization_slug: formData.slug,
              organization_description: formData.description,
              organization_type: formData.organizationType,
              organization_industry: formData.industry,
              organization_size: formData.organizationSize,
            },
          });

          toast.success("Organization was created successfully.", {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            onClose: () => router.back(),
          });
          // console.log(formData);

          reset();
        } else if (error) {
          throw error;
        }
      }
    } catch (error) {
      const err = error as { message: string };
      if (
        err.message.includes(
          'duplicate key value violates unique constraint "organizations_slug_key"'
        )
      ) {
        setError("slug", { type: "manual", message: "Slug is already taken" });
        toast.error("Slug is already taken. Please choose another.");
      } else {
        toast.error(
          err.message || "An error occurred while processing the organization."
        );
      }
    }

    setIsLoading(false);
  };

  // Date Picker
  const [show, setShow] = useState<boolean>(false);
  const handleChange = (selectedDate: Date) => {
    // console.log(selectedDate);
  };
  const handleClose = (state: boolean) => {
    setShow(state);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith("image/")) {
        setImageError("Please upload an image file");
        return;
      }

      setImageError("");
      setPhotoFile(file);
      setPhoto(URL.createObjectURL(file)); // Update the state with the preview URL
    }
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        setBannerError("Please upload an image file");
        return;
      }

      setBannerError("");
      setBannerFile(file);
      setBanner(URL.createObjectURL(file)); // Update the state with the preview URL
    }
  };

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} method="POST">
        <Steps>
          {/* Step 1 */}
          <div id="step1" className="space-y-6">
            <p className="text-xl font-bold text-white">Organization Details</p>
            <div>
              <div className="mb-16">
                <div className="relative mt-4 h-48 w-full rounded-lg font-semibold">
                  {banner ? (
                    <img
                      src={banner}
                      alt="Banner Preview"
                      className="h-full w-full rounded-lg object-cover "
                    />
                  ) : (
                    <div className="h-full w-full rounded-lg bg-charleston"></div>
                  )}
                  <div className="absolute bottom-0 right-0 mb-2 mr-2 flex justify-end">
                    <div className="flex items-center gap-2 rounded-lg bg-eerieblack bg-opacity-25 text-white hover:cursor-pointer hover:bg-gray-500 hover:bg-opacity-25">
                      <CameraIcon className="h-6 w-6 pl-2" />
                      <label
                        htmlFor="banner-input"
                        className="py-2 pr-2 text-sm font-medium hover:cursor-pointer"
                      >
                        Add Banner
                      </label>
                      <input
                        id="banner-input"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-2/3 -translate-x-1/2 translate-y-1/2 transform">
                    <div className="relative">
                      {photo ? (
                        <img
                          src={photo}
                          alt="Photo Preview"
                          className="block h-24 w-24 rounded-lg border-4 border-eerieblack object-cover"
                        />
                      ) : (
                        <div className="block h-24 w-24 rounded-lg border-4 border-eerieblack bg-charleston"></div>
                      )}
                      <div className="absolute bottom-0 left-2/3 mb-2">
                        <label htmlFor="file-input" className="">
                          <CameraIcon className="mr-2 inline-block h-5 w-5 cursor-pointer text-white hover:bg-opacity-25 hover:text-gray-500" />
                        </label>
                        <input
                          id="file-input"
                          accept="image/*"
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {bannerError && <p className="text-red-500">{bannerError}</p>}
              </div>

              <label
                htmlFor="name"
                className="mt-8 block text-sm font-medium leading-6 text-white"
              >
                Organization Name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("name")}
                  onKeyUp={(e) => {
                    if (!formValues) {
                      const target = e.target as HTMLInputElement;
                      const slugValue = slugify(target.value);
                      setValue("slug", slugValue);
                    }
                  }}
                />
                {errors.name && <p className="text-red-500">{errors.name.message}</p>}
              </div>
            </div>
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium leading-6 text-white"
              >
                Slug
              </label>
              <div className="mt-2">
                <input
                  id="slug"
                  type="text"
                  autoComplete="slug"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("slug")}
                  onKeyDown={(event) => {
                    if (
                      !/[a-zA-Z0-9-_]/.test(event.key) &&
                      event.key !== "Backspace" &&
                      event.key !== "Tab" &&
                      event.key !== "ArrowLeft" &&
                      event.key !== "ArrowRight"
                    ) {
                      event.preventDefault();
                    }
                  }}
                />
                <span className="text-xs text-gray-400">
                  Your organization address will be at https://localhost:3001/
                  {getValues("slug")}
                </span>
                {errors.slug && <p className="text-red-500">{errors.slug.message}</p>}
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium leading-6 text-white"
              >
                Description
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  autoComplete="description"
                  className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-red-500">{errors.description.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="organizationType"
                className="block text-sm font-medium leading-6 text-white"
              >
                Type of Organization
              </label>
              <select
                id="organizationType"
                className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                {...register("organizationType")}
              >
                <option disabled selected>
                  Select Type
                </option>
                {ORGANIZATION_TYPES.map((org_type) => (
                  <option key={org_type} value={org_type} className="bg-[#242424]">
                    {org_type}
                  </option>
                ))}
              </select>
              {errors.organizationType && (
                <p className="text-red-500">{errors.organizationType.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium leading-6 text-white"
              >
                Industry / Sector
              </label>
              <select
                id="industry"
                className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                {...register("industry")}
              >
                <option disabled selected>
                  Select Industry
                </option>
                {INDUSTRIES.map((value) => (
                  <option key={value} value={value} className="bg-[#242424]">
                    {value}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-red-500">{errors.industry.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="organizationSize"
                className="block text-sm font-medium leading-6 text-white"
              >
                Organization Size
              </label>
              <select
                id="organizationSize"
                className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                {...register("organizationSize")}
              >
                <option disabled selected>
                  Select Size
                </option>
                {ORGANIZATION_SIZES.map((value) => (
                  <option key={value} value={value} className="bg-[#242424]">
                    {value}
                  </option>
                ))}
              </select>
              {errors.organizationSize && (
                <p className="text-red-500">{errors.organizationSize.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium leading-6 text-white"
              >
                Website URL <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <div className="mt-2">
                <input
                  id="website"
                  type="text"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("website")}
                />
                {errors.website && (
                  <p className="text-red-500">{errors.website.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium leading-6 text-white"
              >
                Date Established
              </label>
              <div className="mt-2">
                <Controller
                  name="dateEstablished"
                  control={control}
                  rules={{ required: "Date Established is required" }}
                  render={({ field }) => (
                    <Datepicker
                      {...field}
                      options={datepicker_options}
                      onChange={(selectedDate) => {
                        field.onChange(selectedDate);
                      }}
                      show={show}
                      setShow={handleClose}
                    />
                  )}
                />
                {errors.dateEstablished && (
                  <p className="text-red-500">{errors.dateEstablished.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="organizationAccess"
                className="block text-sm font-medium leading-6 text-white"
              >
                Organization Access
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <input
                    id="open"
                    type="radio"
                    value="open"
                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                    {...register("organizationAccess")}
                  />
                  <label
                    htmlFor="open"
                    className="ml-3 block text-sm font-medium text-white"
                  >
                    Open to All
                  </label>
                </div>
                <p className="ml-7 text-xs text-gray-400">
                  Anyone can join your organization without approval.
                </p>
                <div className="flex items-center">
                  <input
                    id="approval"
                    type="radio"
                    value="approval"
                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                    {...register("organizationAccess")}
                  />
                  <label
                    htmlFor="approval"
                    className="ml-3 block text-sm font-medium text-white"
                  >
                    Requires Approval
                  </label>
                </div>
                <p className="ml-7 text-xs text-gray-400">
                  New members must be approved by an administrator.
                </p>
              </div>
              {errors.organizationAccess && (
                <p className="text-red-500">{errors.organizationAccess.message}</p>
              )}
            </div>
          </div>
          {/* Step 2 */}
          <div id="step2" className="space-y-6">
            <p className="text-white">Address</p>
            <div>
              <label
                htmlFor="addressLine1"
                className="block text-sm font-medium leading-6 text-white"
              >
                Address Line 1
              </label>
              <div className="mt-2">
                <input
                  id="addressLine1"
                  type="text"
                  autoComplete="address"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("addressLine1")}
                />
                {errors.addressLine1 && (
                  <p className="text-red-500">{errors.addressLine1.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="addressLine2"
                className="block text-sm font-medium leading-6 text-white"
              >
                Address Line 2 <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <div className="mt-2">
                <input
                  id="addressLine2"
                  type="text"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("addressLine2")}
                />
                {errors.addressLine2 && (
                  <p className="text-red-500">{errors.addressLine2.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium leading-6 text-white"
              >
                City
              </label>
              <div className="mt-2">
                <input
                  id="addressLine2"
                  type="text"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("city")}
                />
                {errors.city && <p className="text-red-500">{errors.city.message}</p>}
              </div>
            </div>
            <div>
              <label
                htmlFor="stateProvince"
                className="block text-sm font-medium leading-6 text-white"
              >
                State / Province
              </label>
              <div className="mt-2">
                <input
                  id="stateProvince"
                  type="text"
                  autoComplete="stateProvince"
                  required
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("stateProvince")}
                />
                {errors.stateProvince && (
                  <p className="text-red-500">{errors.stateProvince.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium leading-6 text-white"
              >
                Country
              </label>
              <div className="mt-2">
                <select
                  id="country"
                  className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("country")}
                >
                  <option disabled selected>
                    Select Country
                  </option>
                  {countries.map((x) => (
                    <option key={x.name} value={x.name} className="bg-[#242424]">
                      {x.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-red-500">{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>
          {/* Step 3 */}
          <div id="step3" className="space-y-6 text-white">
            <p className="text-white">Socials</p>
            <div>
              <label
                htmlFor="facebookLink"
                className="block text-sm font-medium leading-6 text-white"
              >
                Facebook Link <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <div className="mt-2">
                <input
                  id="facebookLink"
                  type="text"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("facebookLink")}
                />
                {errors.facebookLink && (
                  <p className="text-red-500">{errors.facebookLink.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="twitterLink"
                className="block text-sm font-medium leading-6 text-white"
              >
                Twitter Link <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <div className="mt-2">
                <input
                  id="twitterLink"
                  type="text"
                  autoComplete="twitterLink"
                  required
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("twitterLink")}
                />
                {errors.twitterLink && (
                  <p className="text-red-500">{errors.twitterLink.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="linkedinLink"
                className="block text-sm font-medium leading-6 text-white"
              >
                LinkedIn <span className="text-sm text-gray-400">(optional)</span>
              </label>
              <div className="mt-2">
                <input
                  id="linkedinLink"
                  type="text"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  {...register("linkedinLink")}
                />
                {errors.linkedinLink && (
                  <p className="text-red-500">{errors.linkedinLink.message}</p>
                )}
              </div>
            </div>
          </div>
          {/* Step 4 */}
          <div id="step4" className="space-y-6 text-white">
            <p className="text-xl font-bold">Confirmation and Submission</p>
            <p>Please review the information below before submitting:</p>
            {formData && (
              <div className="space-y-4">
                {Object.entries(formData).map(([key, value]) => {
                  const displayValue =
                    value instanceof Date ? value.toLocaleDateString() : value;
                  return (
                    <div key={key}>
                      {displayValue && (
                        <>
                          <p className="font-semibold capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </p>
                          <p>{displayValue}</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Steps>
        <div className="navigation mb-4 flex justify-between">
          <button
            className={`flex justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${current == 1 ? "opacity-0" : ""}`}
            onClick={prev}
            disabled={current <= 0}
            type="button"
          >
            Prev
          </button>
          {current === total ? (
            <button
              className="flex justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="submit"
            >
              {isLoading ? "Submit..." : "Submit"}
            </button>
          ) : (
            <button
              className="flex justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={handleNext}
              type="button"
            >
              Next
            </button>
          )}
        </div>
        <div className="steps_data mt-4 flex justify-between text-sm text-white">
          <div>Total Steps: {total}</div>
          <div>Current Step: {current}</div>
          <div>Progress: {progress * 100}%</div>
        </div>
      </form>
    </>
  );
};

export default CreateOrganizationForm;
