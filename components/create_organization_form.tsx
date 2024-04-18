import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Steps, useSteps } from "react-step-builder";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Datepicker from "tailwind-datepicker-react";
import { z } from "zod";

import { insertOrganization } from "@/lib/organization";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

// Define the constants for Type of Organization
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

// Define the constants for Industry/Sector
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

// Define the constants for Organization Size
const ORGANIZATION_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
] as const;

interface OrganizationFormValues {
  name: string;
  slug: string;
  description: string;
  organizationType: string;
  industry: string; // Now simply a string
  organizationSize: string; // Now simply a string
  website: string;
  dateEstablished: Date;

  addressLine1: string;
  addressLine2?: string; // Optional
  city: string;
  stateProvince: string;
  country: string;

  facebookLink?: string; // Optional
  twitterLink?: string; // Optional
  linkedinLink?: string; // Optional
}

const OrganizationSchema = z.object({
  name: z.string().min(1, "Organization Name is required"),
  slug: z.string().min(1, "A valid slug is required"),
  description: z.string().min(1, "Description is required"),
  organizationType: z.enum(ORGANIZATION_TYPES, {
    errorMap: () => ({ message: "Invalid organization type" }),
  }),
  industry: z.enum(INDUSTRIES, {
    errorMap: () => ({ message: "Invalid industry" }),
  }),
  organizationSize: z.enum(ORGANIZATION_SIZES, {
    errorMap: () => ({ message: "Invalid organization size" }),
  }),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  dateEstablished: z.date(),

  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  stateProvince: z.string().min(1, "State / Province is required"),
  country: z.string().min(1, "Country is required"),

  facebookLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
  twitterLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
  linkedinLink: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

const datepicker_options = {
  title: "Calendar",
  autoHide: true,
  todayBtn: true,
  clearBtn: true,
  clearBtnText: "Clear",
  theme: {
    background: "bg-[#158A70] ", //not working when modified
    todayBtn: "", //not working, only text color changes when modified
    clearBtn: "",
    icons: "",
    text: "text-white",
    disabledText: "",
    input:
      "block w-full rounded-md border-0 bg-white/5 py-1.5 text-white  shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6",
    inputIcon: "",
    selected: "bg-primary", //working
  },
  // icons: {
  //   prev: () => <span>Previous</span>,
  //   next: () => <span>Next</span>,
  // },
  datepickerClassNames: "top-12",
  // defaultDate: new Date("2022-01-01"),
  language: "en",
  disabledDates: [],
  weekDays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  inputNameProp: "date",
  inputIdProp: "date",
  inputPlaceholderProp: "Select Date",
  inputDateFormatProp: {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
};

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
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
    return {
      isAvailable: false,
      error: error.message,
    };
  }

  // If data is null, no rows exist, hence the slug is available
  return {
    isAvailable: !data,
    error: null,
  };
}

const CreateOrganizationForm = () => {
  const { prev, next, jump, total, current, progress } = useSteps();

  const [formData, setFormData] = useState<OrganizationFormValues>(null);
  const router = useRouter();

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
    if (slugValue) {
      const timer = setTimeout(async () => {
        const { isAvailable, error } = await checkSlugAvailability(slugValue);

        console.log(isAvailable, error);
        if (error) {
          toast.error("Error checking slug availability");
          console.error("Error fetching slug:", error);
        } else if (!isAvailable) {
          setError("slug", {
            type: "manual",
            message: "Slug is already taken",
          });
        } else {
          clearErrors("slug");
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [slugValue, setError, clearErrors]);

  const handleNext = async () => {
    const currentStepId = `step${current}`;

    const fieldsInStep = document.querySelectorAll(`#${currentStepId} [name]`);

    const fieldNames = Array.from(fieldsInStep).map((field) =>
      field.getAttribute("name")
    );

    const result = await trigger(fieldNames);

    const { isAvailable, error } = await checkSlugAvailability(slugValue);

    console.log(isAvailable, error);
    if (error) {
      toast.error("Error checking slug availability");
      console.error("Error fetching slug:", error);
    } else if (!isAvailable) {
      setError("slug", {
        type: "manual",
        message: "Slug is already taken",
      });
    } else {
      clearErrors("slug");
    }

    if (result && isAvailable) {
      setFormData(getValues());
      next();
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: SubmitHandler<OrganizationFormValues> = async () => {
    setIsLoading(true);
    const formData = getValues();

    const { data, error } = await insertOrganization(formData);

    console.log(data);
    console.log(error);

    if (data) {
      toast.success("Organization was created successfully.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      router.push("/dashboard");
      reset();
    } else if (error) {
      toast.error(error.message || "An error occurred while adding the project");
    }

    setIsLoading(false);
  };

  // Date Picker
  const [show, setShow] = useState<boolean>(false);
  const handleChange = (selectedDate: Date) => {
    console.log(selectedDate);
  };
  const handleClose = (state: boolean) => {
    setShow(state);
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
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()} method="POST">
        <Steps>
          {/* Step 1*/}
          <div id="step1" className="space-y-6">
            <p className="text-xl font-bold text-white">Organization Details</p>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-white"
              >
                Organization Name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 "
                  {...register("name")}
                  onKeyUp={(e) => {
                    const slugValue = slugify(e.target.value);
                    setValue("slug", slugValue); // Automatically update the slug field
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
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 "
                  {...register("slug")}
                />
                <span className="text-xs text-gray-400">
                  Your organization address will be at http://syncup.com/jimtech
                </span>
                {errors.slug && <p className="text-red-500">{errors.slug.message}</p>}
              </div>
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium leading-6 text-white"
              >
                Description
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  autoComplete="description"
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 "
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
                className="focus:ring-primary mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                className="focus:ring-primary mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                className="focus:ring-primary mt-2 block w-full rounded-md border-0 bg-white/5  py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                Website URL
              </label>
              <div className="mt-2">
                <input
                  id="website"
                  type="text"
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                  name="dateEstablished" // The field name
                  control={control} // Pass in the control prop
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
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                  {...register("addressLine1")}
                />
                {errors.addresLine1 && (
                  <p className="text-red-500">{errors.addresLine1.message}</p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="addressLine2"
                className="block text-sm font-medium leading-6 text-white"
              >
                Address Line 2
              </label>
              <div className="mt-2">
                <input
                  id="addressLine2"
                  type="text"
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                <input
                  id="country"
                  type="text"
                  autoComplete="country"
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                  {...register("country")}
                />
                {errors.country && (
                  <p className="text-red-500">{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 3  */}
          <div id="step3" className="space-y-6 text-white">
            <p className="text-white">Socials</p>
            <div>
              <label
                htmlFor="facebookLink"
                className="block text-sm font-medium leading-6 text-white"
              >
                Facebook Link
              </label>
              <div className="mt-2">
                <input
                  id="facebookLink"
                  type="text"
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                Twitter Link
              </label>
              <div className="mt-2">
                <input
                  id="twitterLink"
                  type="text"
                  autoComplete="twitterLink"
                  required
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                LinkedIn
              </label>
              <div className="mt-2">
                <input
                  id="linkedinLink"
                  type="text"
                  className="focus:ring-primary block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
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
                  // Example of custom formatting: if the value is a Date, format it
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

        {/* <Navigation onSubmit={onSubmit} trigger={trigger} isValid={isValid} />
         */}

        {/* Navidation */}
        <div className="navigation mb-4 flex justify-between">
          <button
            className="bg-primary hover:bg-primarydark focus-visible:outline-primary flex justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={prev}
            disabled={current <= 0}
            type="button"
          >
            Prev
          </button>
          {current === total ? (
            <button
              className="bg-primary hover:bg-primarydark focus-visible:outline-primary flex justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              type="submit"
              onClick={onSubmit}
            >
              {isLoading ? "Submit..." : "Submit"}
            </button>
          ) : (
            <button
              className="bg-primary hover:bg-primarydark focus-visible:outline-primary flex justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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
