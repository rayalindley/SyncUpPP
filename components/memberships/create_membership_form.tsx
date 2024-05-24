import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { Membership } from "@/lib/types";
import { useRouter } from "next/navigation";

const membershipSchema = z.object({
  name: z.string(),
  registrationfee: z
    .number()
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
  organizationid = null,
  membership,
}: {
  organizationid: string | null;
  membership?: Membership;
}) => {
  const initialFormData: Membership = {
    name: "",
    membershipid: "",
    organizationid: organizationid || "",
    price: 0, // Add this property
    duration: "", // Add this property
    description: "",
    registrationfee: 0,
    features: [],
    mostPopular: false,
  };

  const [formData, setFormData] = useState<Membership>(initialFormData);
  const router = useRouter();

  // console.log("membership", membership);

  useEffect(() => {
    if (membership) {
      setFormData(membership);
    } else {
      setFormData(initialFormData);
    }
  }, [membership]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newValue = name === "registrationfee" ? parseFloat(value) : value; // Parse registration fee as a number
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Filter out empty or whitespace-only feature fields
      const filteredFeatures =
        formData.features?.filter((feature) => feature.trim() !== "") ?? [];

      // Update the formData with filtered features
      const updatedFormData = { ...formData, features: filteredFeatures };

      const validatedData = membershipSchema.parse(updatedFormData);
      const supabase = createClient();

      if (membership) {
        // Update existing membership
        const { data, error } = await supabase
          .from("memberships")
          .update(validatedData)
          .eq("membershipid", membership.membershipid);

        if (error) {
          throw error;
        }

        toast.success("Membership updated successfully", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          onClose: () => router.back(),
        });

        // console.log(data);
      } else {
        // Insert new membership
        const { data, error } = await supabase
          .from("memberships")
          .insert([validatedData]);

        if (error) {
          throw error;
        }

        toast.success("Membership created successfully", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          onClose: () => router.back(),
        });

        // console.log(data);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error("Error creating/updating membership:", (error as Error).message);
      if ((error as Error).message === "Registration Fee is too large") {
        toast.error("The registration fee entered is too large", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.error("Failed to create/update membership", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(formData.features ?? [])];
    newFeatures[index] = value;
    setFormData((prevData) => ({
      ...prevData,
      features: newFeatures,
    }));
  };

  const handleAddFeature = () => {
    setFormData((prevData) => ({
      ...prevData,
      features: [...(prevData.features ?? []), ""], // Adding a new empty feature field
    }));
  };

  const handleDeleteFeature = (indexToDelete: number) => {
    setFormData((prevData) => ({
      ...prevData,
      features: (prevData.features ?? []).filter((_, index) => index !== indexToDelete),
    }));
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
          <label
            htmlFor="features"
            className="mt-6 block text-sm font-medium leading-6 text-white"
          >
            Features:
          </label>
          {formData.features?.map((feature, index) => (
            <div key={index} className="relative mt-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 pr-20 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
              {formData.features && index === formData.features.length - 1 ? (
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="absolute right-2 top-2/4 -translate-y-2/4 rounded-md bg-primary bg-opacity-10 px-1.5 text-white hover:bg-primarydark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50"
                >
                  +
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDeleteFeature(index)}
                  className="absolute right-2 top-2/4 -translate-y-2/4 rounded-md bg-red-500 bg-opacity-10 px-2 text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-opacity-50"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="mt-5 flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {membership ? "Update Membership" : "Create Membership"}
        </button>
      </form>
    </div>
  );
};

export default CreateMembershipForm;
