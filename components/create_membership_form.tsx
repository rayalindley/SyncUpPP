import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        <button
          type="submit"
          className="mt-5 flex justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Create Membership
        </button>
      </form>
    </div>
  );
};

export default CreateMembershipForm;
