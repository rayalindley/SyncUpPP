import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { Membership } from "@/lib/types";

// Define props types
interface CreateMembershipModalProps {
  organizationId: string;
  membership?: Membership;
  isOpen: boolean;
  onClose: () => void;
}

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
  organizationId: z.string(), // updated to use camelCase
  features: z.array(z.string()).nonempty("At least one feature is required"),
  yearlydiscount: z
    .number()
    .min(0, "Discount cannot be negative")
    .refine((value) => {
      if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
        throw new Error("Discount Fee is too large");
      }
      return true;
    }),
});

const fetchData = async (organizationId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("organizationid", organizationId);
  if (error) {
    throw error;
  }
  return data;
};

const CreateMembershipModal: React.FC<CreateMembershipModalProps> = ({
  organizationId,
  membership,
  isOpen,
  onClose,
}) => {
  const initialFormData: Membership = {
    name: "",
    membershipid: "",
    organizationId: organizationId,
    description: "",
    registrationfee: 0,
    features: [""],
    mostPopular: false,
    yearlydiscount: 0,
  };

  const [formData, setFormData] = useState<Membership>(initialFormData);

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      type: value,
    }));
  };

  useEffect(() => {
    if (membership) {
      setFormData(membership);
    } else {
      setFormData(initialFormData);
    }
  }, [membership]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const parsedValue =
      name === "registrationfee" || name === "yearlydiscount" ? parseFloat(value) : value;
    setFormData((prevData) => ({
      ...prevData,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const filteredFeatures =
        formData.features?.filter((feature) => feature.trim() !== "") || [];
      const updatedFormData = { ...formData, features: filteredFeatures };

      const validatedData = membershipSchema.parse(updatedFormData);
      const supabase = createClient();
      if (membership) {
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
        });
      } else {
        const { data, error } = await supabase
          .from("memberships")
          .insert([validatedData]);
        if (error) {
          throw error;
        }
        toast.success("Membership created successfully", {
          position: "bottom-right",
          autoClose: 3000,
        });
        setFormData(initialFormData);
      }
      onClose();
    } catch (error: any) {
      console.error("Error creating/updating membership:", error.message);
      if (error.message === "Registration Fee is too large") {
        toast.error("The registration fee entered is too large", {
          position: "bottom-right",
          autoClose: 3000,
        });
      } else {
        toast.error("Failed to create/update membership", {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = value;
    setFormData((prevData) => ({
      ...prevData,
      features: newFeatures,
    }));

    if (index === 0) {
      setTopmostFeatureEmpty(value.trim() === "");
    }
  };

  const handleAddFeature = () => {
    setFormData((prevData) => ({
      ...prevData,
      features: ["", ...(prevData.features || [])],
    }));
  };

  const handleDeleteFeature = (indexToDelete: number) => {
    setFormData((prevData) => ({
      ...prevData,
      features: prevData.features?.filter((_, index) => index !== indexToDelete),
    }));
  };

  const [topmostFeatureEmpty, setTopmostFeatureEmpty] = useState(true);

  useEffect(() => {
    setTopmostFeatureEmpty((formData.features || [])[0]?.trim() === "");
  }, [formData.features]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-eerieblack p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="flex items-center justify-between text-lg font-medium leading-6 text-white"
                >
                  {membership ? "Update Membership" : "Create Membership"}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                  >
                    &#x2715;
                  </button>
                </Dialog.Title>
                <div className="mt-2 space-y-6 text-white">
                  <ToastContainer />
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
                          pattern="[0-9]*[.]?[0-9]*"
                          title="Please enter a valid registration fee"
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 pl-12 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="yearlydiscount"
                          className="block text-sm font-medium leading-6 text-white"
                        >
                          Yearly Discount (%):
                        </label>
                        <div className="relative mt-2">
                          <input
                            type="number"
                            id="yearlydiscount"
                            name="yearlydiscount"
                            value={formData.yearlydiscount}
                            onChange={handleChange}
                            className="block w-full rounded-md border-0 bg-white/5 py-1.5 pr-12 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                          />
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-white">
                            %
                          </span>
                        </div>
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
                      <div>
                        <div className="relative mt-2">
                          <input
                            type="text"
                            value={formData.features?.[0] || ""}
                            onChange={(e) => handleFeatureChange(0, e.target.value)}
                            className="block w-full rounded-md border-0 bg-white/5 py-1.5 pr-20 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                          />
                          <button
                            type="button"
                            onClick={handleAddFeature}
                            disabled={topmostFeatureEmpty}
                            className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 transform items-center justify-center rounded-md bg-primary text-white hover:bg-primarydark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50"
                          >
                            +
                          </button>
                        </div>
                        {formData.features?.slice(1).map((feature, index) => (
                          <div key={index + 1} className="relative mt-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) =>
                                handleFeatureChange(index + 1, e.target.value)
                              }
                              className="block w-full rounded-md border-0 bg-white/5 py-1.5 pr-20 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteFeature(index + 1)}
                              className="absolute right-2 top-2/4 size-5 -translate-y-2/4 rounded-md bg-red-500 text-xs text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-opacity-50"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2"></div>
                    <div className="flex items-center justify-end">
                      <button
                        type="submit"
                        className="mt-5 flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {membership ? "Save Changes" : "Create Membership"}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateMembershipModal;
