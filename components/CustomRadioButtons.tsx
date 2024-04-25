import { useState } from "react";
import { RadioGroup } from "@headlessui/react";

// SVG icons
const icon4GB = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const icon16GB = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const memoryOptions = [
  { name: icon4GB, inStock: true },
  { name: "/", inStock: true }, // Replaced icon8GB with "/"
  { name: icon16GB, inStock: true },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function CustomRadioButtons() {
  const [mem, setMem] = useState(memoryOptions[0]); // Default to icon4GB

  return (
    <div className="">
      <RadioGroup value={mem} onChange={setMem} className="mt-2">
        <div className="flex grid grid-cols-3">
          {memoryOptions.map((option) => (
            <RadioGroup.Option
              key={option.name}
              value={option}
              className={({ active, checked }) =>
                classNames(
                  option.inStock
                    ? "cursor-pointer focus:outline-none"
                    : "cursor-not-allowed opacity-25",
                  active ? "ring-2 ring-indigo-600 ring-offset-2" : "",
                  checked
                    ? "bg-primary text-white hover:bg-indigo-500"
                    : "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
                  "flex items-center justify-center rounded-md px-1 py-0.5 text-sm font-semibold uppercase sm:flex-1" // Adjust px and py here
                )
              }
              disabled={!option.inStock}
            >
              {/* Render the SVG icon or text */}
              <RadioGroup.Label as="span">{option.name}</RadioGroup.Label>
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
