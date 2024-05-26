import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Membership } from "@/lib/types";

interface CreateMembershipModalProps {
  organizationid: string;
  membership?: Membership;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

const membershipSchema = z.object({
  name: z.string().nonempty("Name is required"),
  registrationfee: z
    .number()
    .min(0, "Registration Fee cannot be negative")
    .refine((value) => {
      if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
        throw new Error("Registration Fee is too large");
      }
      return true;
    }),
  description: z.string().nonempty("Description is required"),
  organizationid: z.string(),
  features: z.array(z.string()).optional(),
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

const fetchData = async (organizationid: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("organizationid", organizationid);
  if (error) {
    throw error;
  }
  return data;
};

const CreateMembershipModal: React.FC<CreateMembershipModalProps> = ({
  organizationid,
  membership,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const initialFormData: Membership = {
    name: "",
    membershipid: "",
    organizationid: organizationid,
    description: "",
    registrationfee: 0,
    features: [],
    mostPopular: false,
    yearlydiscount: 0,
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Membership>({
    resolver: zodResolver(membershipSchema),
    defaultValues: initialFormData,
  });

  useEffect(() => {
    if (membership) {
      reset(membership);
    } else {
      reset(initialFormData);
    }
  }, [membership, reset]);

  const onSubmitForm = async (data: Membership) => {
    try {
      const supabase = createClient();
      if (membership) {
        const { error } = await supabase
          .from("memberships")
          .update(data)
          .eq("membershipid", membership.membershipid);
        if (error) {
          throw error;
        }
        toast.success("Membership updated successfully", {
          position: "bottom-right",
          autoClose: 3000,
        });
      } else {
        const { error } = await supabase.from("memberships").insert([data]);
        if (error) {
          throw error;
        }
        toast.success("Membership created successfully", {
          position: "bottom-right",
          autoClose: 3000,
        });
        reset(initialFormData);
      }
      onClose();
      if (onSubmit) onSubmit();
    } catch (error: any) {
      console.error("Error creating/updating membership:", error.message);
      toast.error("Failed to create/update membership", {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

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
                  <form
                    className="space-y-6 text-white"
                    onSubmit={handleSubmit(onSubmitForm)}
                  >
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
                          {...register("name")}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
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
                          {...register("registrationfee", { valueAsNumber: true })}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 pl-12 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                        {errors.registrationfee && (
                          <p className="text-sm text-red-500">
                            {errors.registrationfee.message}
                          </p>
                        )}
                      </div>
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
                          {...register("yearlydiscount", { valueAsNumber: true })}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 pr-12 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-white">
                          %
                        </span>
                        {errors.yearlydiscount && (
                          <p className="text-sm text-red-500">
                            {errors.yearlydiscount.message}
                          </p>
                        )}
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
                          {...register("description")}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                        {errors.description && (
                          <p className="text-sm text-red-500">
                            {errors.description.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="features"
                        className="mt-6 block text-sm font-medium leading-6 text-white"
                      >
                        Features:
                      </label>
                      <Controller
                        control={control}
                        name="features"
                        render={({ field }) => (
                          <div>
                            {(field.value ?? []).map((feature, index) => (
                              <div key={index} className="relative mt-2">
                                <input
                                  type="text"
                                  value={feature}
                                  onChange={(e) => {
                                    const newFeatures = [...(field.value ?? [])];
                                    newFeatures[index] = e.target.value;
                                    field.onChange(newFeatures);
                                  }}
                                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 pr-20 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFeatures = (field.value ?? []).filter(
                                      (_, i) => i !== index
                                    );
                                    field.onChange(newFeatures);
                                  }}
                                  className="absolute right-2 top-2/4 size-5 -translate-y-2/4 rounded-md bg-red-500 text-xs text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-opacity-50"
                                >
                                  x
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => field.onChange([...(field.value ?? []), ""])}
                              className="mt-2 rounded-md bg-primary px-3 py-1 text-white hover:bg-primarydark"
                            >
                              Add Feature
                            </button>
                          </div>
                        )}
                      />
                    </div>
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
