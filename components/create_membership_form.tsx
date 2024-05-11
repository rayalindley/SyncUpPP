import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";

interface MembershipTier {
  name: string;
  registrationfee: number;
  description: string;
  organizationid: string;
  features: string[];
}

const membershipSchema = z.object({
  name: z.string(),
  registrationfee: z.number()
  .min(0, "Registration Fee cannot be negative")
  .refine((value) => {
    if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      throw new Error("Registration Fee is too large");
    }
    return true;
  }),
  description: z.string(),
  organizationid: z.string(),
  features: z.array(z.string()).nonempty("At least one feature is required"),
});

const CreateMembershipForm = ({
  organizationId,
  membership,
}: {
  organizationId: string;
  membership?: MembershipTier;
}) => {
  const initialFormData = membership
    ? membership
    : {
        name: "",
        registrationfee: 0,
        description: "",
        organizationid: organizationId,
        features: [""],
      };

  const [formData, setFormData] = useState<MembershipTier>(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'registrationfee' ? parseFloat(value) : value; // Parse registration fee as a number
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Show toast message for successful creation
    toast.success("Membership created successfully", {
      position: "bottom-right", // Change position to bottom-right
      autoClose: 3000, // Close the toast after 3 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    // Reset form data after submission
    setFormData({
      name: "",
      registrationfee: 0,
      description: "",
    });
  };
  return (
    <div className="space-y-6 text-white">
      <ToastContainer />
      <p className="text-xl font-bold text-white">Membership Details</p>
      <form className="space-y-6 text-white" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium leading-6 text-white"
          >
            Name:
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div>
            <label
              htmlFor="registrationfee"
              className="block text-sm font-medium leading-6 text-white"
            >
              Registration Fee:
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-white">
                Php
              </span>
              <input
                type="number"
                id="registrationfee"
                name="registrationfee"
                value={formData.registrationfee}
                onChange={handleChange}
                required
                pattern="[0-9]*[.]?[0-9]*" // Allows only numeric and decimal values
                title="Please enter a valid registration fee" // Tooltip for invalid input
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 pl-12 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium leading-6 text-white"
          >
            Description:
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div>
          <label htmlFor="features" className="mt-6 block text-sm font-medium leading-6 text-white">
            Features:
          </label>
          {formData.features.map((feature, index) => (
            <div key={index} className="relative mt-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                className="block w-full pr-20 rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
              {index === formData.features.length - 1 ? (
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="absolute  bg-opacity-10 right-2 top-2/4 -translate-y-2/4 px-1.5  text-white bg-primary rounded-md hover:bg-primarydark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50"
                >
                  +
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDeleteFeature(index)}
                  className="absolute bg-opacity-10 right-2 top-2/4 -translate-y-2/4 px-2  text-white bg-red-500 rounded-md hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-opacity-50"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="mt-5 w-full flex justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {membership ? "Update Membership" : "Create Membership"}
        </button>
      </form>
    </div>
  );
};


export default CreateMembershipForm;
