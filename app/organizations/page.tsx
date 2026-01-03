"use client";

import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { createClient, getUser } from "@/lib/supabase/client";

export default function CreateOrganizationPage() {
  const [user, setUser] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [industry, setIndustry] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  // Example organization type & industry options
  const organizationTypeOptions = [
    "Nonprofit",
    "For-Profit",
    "Governmental",
    "Educational",
    "Partnership",
    "Corporation",
    "Sole Proprietorship",
    "Limited Liability Company (LLC)",
  ];

  const industryOptions = [
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
  ];

  // Fetch user on mount
  useState(() => {
    async function fetchUser() {
      const { user } = await getUser();
      setUser(user);
    }
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    // Insert logic for uploading files and creating organization
    // Example:
    // await supabase.from("organizations").insert({ name, slug, description, organizationType, industry, ... });
    alert("Organization created! (This is a placeholder)");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} />

      <main className="flex flex-grow flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24 w-full">
        <div className="w-full max-w-7xl mt-8">
          <div className="bg-gray-900 rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-white mb-6 text-center md:text-left">
              Create Organization
            </h1>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Organization Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 p-2 text-white focus:border-primary focus:ring-primary"
                  placeholder="Enter organization name"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 p-2 text-white focus:border-primary focus:ring-primary"
                  placeholder="unique-slug"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 p-2 text-white focus:border-primary focus:ring-primary"
                  rows={4}
                  placeholder="Write a brief description about your organization"
                  required
                />
              </div>

              {/* Organization Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Organization Type</label>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 p-2 text-white focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="">Select type</option>
                  {organizationTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800 p-2 text-white focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="">Select industry</option>
                  {industryOptions.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo / Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Organization Logo</label>
                <input
                  type="file"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-gray-300 file:rounded-lg file:border file:border-gray-600 file:bg-gray-800 file:text-white"
                />
              </div>

              {/* Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Banner Image</label>
                <input
                  type="file"
                  onChange={(e) => setBanner(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-gray-300 file:rounded-lg file:border file:border-gray-600 file:bg-gray-800 file:text-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primarydark"
                >
                  Create
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-gray-600 px-6 py-2 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
