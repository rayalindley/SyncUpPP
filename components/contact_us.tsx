"use client";
import Link from 'next/link';
import { useState } from 'react';
import { ToastContainer, toast } from "react-toastify"; // Import toast
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Email sent successfully!"); // Use toast for success
        setFormData({ name: '', email: '', message: '' }); // Reset form
      } else {
        const errorData = await response.json(); // Assuming the API returns error details
        toast.error(`Error sending email: ${errorData.message}`); // Use toast for error
      }
    } catch (error) {
      toast.error(`Error sending email`); // Use toast for error
      console.error("Error:", error);
    }
  };

  return (
    <>
      <ToastContainer /> {/* Render the toast notifications */}
      <div id="contactus" className="relative isolate bg-eerieblack px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-xl lg:max-w-2xl">
          <h2 className="text-light flex text-4xl font-bold tracking-tight">Contact Us</h2>
          <p className="text-light mt-2 text-lg leading-8">
            Have questions or need assistance? Reach out to our friendly team for support,
            inquiries, or partnership opportunities. You can also send a message to <a href="mailto:syncup.supp@gmail.com" className="text-primary font-semibold">syncup.supp@gmail.com</a>.
          </p>
          <div className="mt-16 flex flex-col gap-16 sm:gap-y-20 lg:flex-row">
            <form onSubmit={handleSubmit} className="lg:flex-auto">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="text-light block text-sm font-semibold leading-6">Name</label>
                  <div className="mt-2.5">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="focus:ring-primary text-light placeholder:text-light block w-full rounded-md border-0 bg-charleston px-3.5 py-2 shadow-sm ring-1 ring-inset ring-raisinblack focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="text-light block text-sm font-semibold leading-6">Email Address</label>
                  <div className="mt-2.5">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="focus:ring-primary text-light placeholder:text-light block w-full rounded-md border-0 bg-charleston px-3.5 py-2 shadow-sm ring-1 ring-inset ring-raisinblack focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="text-light block text-sm font-semibold leading-6">Message</label>
                  <div className="mt-2.5">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="focus:ring-primary text-light placeholder:text-light block w-full rounded-md border-0 bg-charleston px-3.5 py-2 shadow-sm ring-1 ring-inset ring-raisinblack focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-10">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primarydark focus-visible:outline-primary block w-full rounded-md px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Submit
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-500">
                By submitting this form, I agree to the{" "}
                <a href="/privacy-policy" className="text-primary font-semibold">privacy&nbsp;policy</a>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
