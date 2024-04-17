"use client";
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Home", href: "#" },
  { name: "Features", href: "#features" },
  { name: "Community", href: "#community" },
  { name: "Pricing", href: "#pricing" },
  { name: "Contact Us", href: "#contactus" },
];

export default function Header({ user }: { user: User }) {
  const handleNavClick = (href) => {
    const target = document.querySelector(href);
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 100, // Adjust scroll offset if needed
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const { hash } = window.location;
      if (hash) {
        handleNavClick(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-eerieblack">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">SyncUp</span>
            <img className="h-8 w-auto" src="Symbian.png" alt="" />
          </a>
          <div className="font text-l flex items-center px-2 font-semibold text-chinawhite">
            Sync Up
          </div>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-chinawhite hover:text-junglegreen"
            >
              {item.name}
            </a>
          ))}
        </div>
        <div className="flex flex-1 items-center justify-end gap-x-6">
          {user ? (
            <a
              href="/dashboard"
              className="rounded-md bg-darkjunglegreen px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-junglegreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-junglegreen"
            >
              Dashboard
            </a>
          ) : (
            <>
              <a
                href="/signin"
                className="hidden hover:text-junglegreen lg:block lg:text-sm lg:font-semibold lg:leading-6 lg:text-chinawhite"
              >
                Log in
              </a>
              <a
                href="/signup"
                className="rounded-md bg-darkjunglegreen px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-junglegreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-junglegreen"
              >
                Sign up
              </a>
            </>
          )}
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </nav>
      <Dialog
        as="div"
        className="lg:hidden"
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
      >
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center gap-x-6">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <img
                className="h-8 w-auto"
                src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                alt=""
              />
            </a>
            <a
              href="#"
              className="ml-auto rounded-md bg-junglegreen px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-darkjunglegreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-junglegreen"
            >
              Sign up
            </a>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              <div className="py-6">
                <a
                  href="/signin"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                >
                  Log in
                </a>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}
