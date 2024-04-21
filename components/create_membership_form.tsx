import React, { useState } from "react";

interface MembershipTier {
  name: string;
  price: number;
  benefits: string[];
}

const CreateMembershipForm: React.FC = () => {
  const [formData, setFormData] = useState<MembershipTier>({
    name: "",
    price: 0,
    benefits: [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleBenefitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      benefits: [...prevData.benefits, value],
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData); // You can handle form submission here
    // Reset form data after submission
    setFormData({
      name: "",
      price: 0,
      benefits: [],
    });
  };

  return (
    <div className="space-y-6 text-white">
      <h2>Membership Details</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
          />
        </div>
        <div>
          <label htmlFor="price">Price:</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
          />
        </div>
        <div>
          <label htmlFor="benefits">Benefits:</label>
          <input
            type="text"
            id="benefits"
            name="benefits"
            value={formData.benefits}
            onChange={handleBenefitChange}
            placeholder="Enter benefit and press enter"
            className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
          />
          <ul>
            {formData.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>
        <button
          type="submit"
          className="mt-5 flex justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Create Tier
        </button>
      </form>
    </div>
  );
};

export default CreateMembershipForm;
