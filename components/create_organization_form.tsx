import React, { Fragment, useState } from "react";
import { Steps, StepsProvider, useSteps } from "react-step-builder";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import Datepicker from "tailwind-datepicker-react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

const OrganizationSchema = z.object({
  name: z.string().min(1, "Organization Name is required"),
  organizationType: z.enum(ORGANIZATION_TYPES),
  industry: z.enum(INDUSTRIES),
  organizationSize: z.enum(ORGANIZATION_SIZES),
  website: z.string().url("Invalid URL format"),
  dateEstablished: z.date(),

  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email format"),
  phoneNumber: z.string().min(1, "Phone Number is required"),

  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  stateProvince: z.string().min(1, "State / Province is required"),
  country: z.string().min(1, "Country is required"),

  facebookLink: z.string().url("Invalid URL format").optional(),
  twitterLink: z.string().url("Invalid URL format").optional(),
  linkedinLink: z.string().url("Invalid URL format").optional(),
});

const datepicker_options = {
  title: "Calendar",
  autoHide: true,
  todayBtn: false,
  clearBtn: true,
  clearBtnText: "Clear",
  theme: {
    background: "bg-[#242424] ",
    todayBtn: "",
    clearBtn: "",
    icons: "",
    text: "text-white",
    disabledText: "",
    input:
      "block w-full rounded-md border-0 bg-white/5 py-1.5 text-white  shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6",
    inputIcon: "",
    selected: "",
  },
  // icons: {
  //   prev: () => <span>Previous</span>,
  //   next: () => <span>Next</span>,
  // },
  datepickerClassNames: "top-12",
  defaultDate: new Date("2022-01-01"),
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

const CreateOrganizationForm = () => {
  const { next, prev } = useSteps();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(OrganizationSchema),
  });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (formData) => {
    console.log(formData);
    // const { data, error } = await insertProject(formData);

    // if (data) {
    //   toast.success("Project added successfully", {
    //     position: "bottom-right",
    //     autoClose: 5000,
    //     hideProgressBar: false,
    //     closeOnClick: true,
    //     pauseOnHover: true,
    //     draggable: true,
    //     progress: undefined,
    //     theme: "light",
    //   });
    //   reset();
    //   setOpen(false);
    // } else if (error) {
    //   toast.error(error.message || "An error occurred while adding the project");
    // }

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
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 "
                {...register("name")}
              />
              {errors.name && <p className="text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          <div>
            <label
              htmlFor="org_type"
              className="block text-sm font-medium leading-6 text-white"
            >
              Type of Organization
            </label>
            <select
              id="org_type"
              name="org_type"
              className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
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
            {errors.org_type && <p className="text-red-500">{errors.org_type.message}</p>}
          </div>

          <div>
            <label
              htmlFor="org_industry"
              className="block text-sm font-medium leading-6 text-white"
            >
              Industry / Sector
            </label>
            <select
              id="org_industry"
              name="org_industry"
              className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
            >
              <option disabled selected>
                Select Industry
              </option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry} className="bg-[#242424]">
                  {industry}
                </option>
              ))}
            </select>
            {errors.org_industry && (
              <p className="text-red-500">{errors.org_industry.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="org_size"
              className="block text-sm font-medium leading-6 text-white"
            >
              Organization Size
            </label>
            <select
              id="org_size"
              name="org_size"
              className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5  text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
            >
              <option disabled selected>
                Select Size
              </option>
              {ORGANIZATION_SIZES.map((org_size) => (
                <option key={org_size} value={org_size} className="bg-[#242424]">
                  {org_size}
                </option>
              ))}
            </select>
            {errors.org_size && <p className="text-red-500">{errors.org_size.message}</p>}
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
                name="website"
                type="text"
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
              {errors.website && <p className="text-red-500">{errors.website.message}</p>}
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
              <Datepicker
                options={datepicker_options}
                onChange={handleChange}
                show={show}
                setShow={handleClose}
              />
            </div>
          </div>
        </div>
        {/* Step 2 */}
        <div className="space-y-6">
          <p className="text-white">Address</p>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-white"
            >
              Address Line 1
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-white"
            >
              Address Line 2
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-white"
            >
              City
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-white"
            >
              State / Province
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-white"
            >
              Country
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>

        {/* Step 3  */}
        <div className="space-y-6 text-white">
          <p className="text-white">Socials</p>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-white"
            >
              Facebook Link
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-white"
            >
              Twitter Link
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-white"
            >
              LinkedIn
            </label>
            <div className="mt-2">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="space-y-6 text-white">
          Final Step: Confirmation and Submission Summary of all information entered for
          review. Checkbox for terms and conditions agreement. Submit button to complete
          the registration.
        </div>
      </Steps>

      <Navigation handleSubmit={handleSubmit} />
    </form>
  );
};

export default CreateOrganizationForm;

interface NavigationProps {
  handleSubmit: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ handleSubmit }) => {
  const { prev, next, jump, total, current, progress } = useSteps();

  const [validationError, setValidationError] = useState(false);

  const handleNext = () => {
    next(); // Proceed to the next step
  };

  return (
    <>
      <div className="navigation mb-4 flex justify-between">
        <button
          className="flex justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          onClick={prev}
          disabled={current <= 0}
          type="button"
        >
          Prev
        </button>
        {current === total ? (
          <button
            className="flex justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            onClick={handleSubmit}
            type="button"
          >
            Submit
          </button>
        ) : (
          <button
            className="flex justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
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
    </>
  );
};
