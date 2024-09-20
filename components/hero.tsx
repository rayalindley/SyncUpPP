"use client";
import { useState } from "react";

export default function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  return (
    <div className="relative pt-14">
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-light">A CRM Solution for Organizations</p>
            <h1 className="text-light my-4 text-4xl font-bold tracking-tight sm:text-6xl">
              Organize, Connect, and Empower Your Organization&apos;s Members
            </h1>
            <p className="text-light mt-6 text-lg leading-8">
              Streamline operations and boost engagement with our all-in-one CRM solution,
              designed to simplify management tasks and enhance collaboration.
            </p>
            {/* <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#"
                className="bg-primary hover:bg-primarydark rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Start Free Trial
              </a>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
