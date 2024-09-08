"use client";

import React, { useState } from "react";
import TagsInput from "@/components/custom/tags-input";

const roleSuggestions = [
  "Admin",
  "Manager",
  "Developer",
  "Designer",
  "QA",
  "DevOps",
  "Product Owner",
  "Scrum Master",
  "UX Researcher",
  "Data Analyst",
  "Marketing Specialist",
  "Sales Representative",
  "Customer Support",
  "Finance Manager",
  "HR Generalist",
];

export default function SamplePage() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Tags Input Example</h1>
      <div className="max-w-md">
        <TagsInput
          value={tags}
          onChange={setTags}
          suggestions={roleSuggestions}
          placeholder="Add role tags..."
          minItems={1}
          maxItems={5}
          className="mb-4"
        />
        <div>
          <h2 className="mb-2 text-lg font-semibold">Selected Tags:</h2>
          <ul className="list-disc pl-5">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
