import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";

interface MembershipTier {
  name: string;
  registrationfee: number;
  description: string;
  features: string[];
}

const EditMembershipForm = ({ formValues = null }: { formValues: any | null }) => {
  const [formData, setFormData] = useState<MembershipTier>({
    name: "",
    registrationfee: 0,
    description: "",
    features: [""],
  });

  useEffect(() => {
    if (formValues) {
      setFormData({
        name: formValues.name || "",
        registrationfee: formValues.registrationfee || 0,
        description: formValues.description || "",
        features: formValues.features || [""],
      });
    }
  }, [formValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("memberships")
        .insert([{ ...formData }]);
      if (error) {
        throw error;
      }
      // console.log(data); // Log the response from Supabase
      toast.success("Membership created successfully", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setFormData({
        name: "",
        registrationfee: 0,
        description: "",
        features: [],
      });
    } catch (error) {
      console.error("Error creating membership:", error);
      toast.error("Failed to create membership", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData((prevData) => ({
      ...prevData,
      features: newFeatures,
    }));
  };

  const handleAddFeature = () => {
    setFormData((prevData) => ({
      ...prevData,
      features: [...prevData.features, ""],
    }));
  };

  const handleDeleteFeature = (indexToDelete: number) => {
    setFormData((prevData) => ({
      ...prevData,
      features: prevData.features.filter((_, index) => index !== indexToDelete),
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
              step="any"
              inputMode="numeric"
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
          {formData.features.map((feature, index) => (
            <div key={index} className="relative mt-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 pr-20 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
              {index === formData.features.length - 1 ? (
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="absolute  right-2 top-2/4 -translate-y-2/4 rounded-md bg-primary  bg-opacity-10 px-1.5 text-white hover:bg-primarydark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50"
                >
                  +
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDeleteFeature(index)}
                  className="absolute right-2 top-2/4 -translate-y-2/4 rounded-md bg-red-500  bg-opacity-10 px-2 text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-opacity-50"
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
          Create Membership
        </button>
      </form>
    </div>
  );
};

export default EditMembershipForm;
