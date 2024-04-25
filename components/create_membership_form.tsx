import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PermissionsTabs from "./PermissionsTabs";
import Divider from "./divider";
import GeneralChannelPermissions from "./GeneralChannelPermissions";

interface MembershipTier {
  name: string;
  registrationfee: number;
  description: string;
}

const CreateMembershipForm: React.FC = () => {
  const [formData, setFormData] = useState<MembershipTier>({
    name: "",
    registrationfee: 0,
    description: "",
  });
  const [step, setStep] = useState<number>(1);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAcceptTerms = () => {
    setAcceptTerms(true);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.error("Please accept the terms of service");
      return;
    }
    console.log(formData); // You can handle form submission here
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
    setStep(1);
    setAcceptTerms(false);
  };

  return (
    <div className="space-y-6 text-white">
      <ToastContainer />
      {step === 1 && (
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
          <button
            type="button"
            onClick={handleAcceptTerms}
            className="mt-5 flex justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Next
          </button>
        </form>
      )}
      {step === 2 && (
        <div>
          <p className="mb-4 text-lg font-semibold text-white">Manage Permissions</p>
          <div className="flex gap-2">
            <div className="mt-4" style={{ flex: "1 1 auto" }}>
              <PermissionsTabs />
            </div>
            <div className="mt-5 px-6">
              <Divider />
            </div>
            <div className="mt-4" style={{ flex: "1 1 auto" }}>
              <GeneralChannelPermissions />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-5 flex justify-center rounded-md bg-gray-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="mt-5 flex justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Create Membership
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMembershipForm;
