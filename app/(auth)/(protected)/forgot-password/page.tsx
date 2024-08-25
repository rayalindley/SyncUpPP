"use client";

import { useState } from "react";
import { AuthController } from "@/controllers/authController";

export default function ForgotPassword({ searchParams }: { searchParams: any }) {
  const authController = new AuthController();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await authController.forgotPassword(formData);
      setSuccess("Check your inbox for instructions to reset your password.");
      setError(null);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      setSuccess(null);
    }
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center bg-eerieblack py-12 sm:px-6 lg:px-8">
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="m-3 rounded-lg bg-charleston px-6 py-12 shadow sm:px-12">
            <div className="mb-6 sm:mx-auto sm:w-full sm:max-w-md">
              <img className="mx-auto h-10 w-auto" src="Symbian.png" alt="SyncUp" />
              <h2 className="text-light mt-3 text-center text-2xl font-bold leading-9 tracking-tight">
                Reset your password
              </h2>
              <p className="text-light text-center text-sm">
                Enter your email to receive instructions on how to reset your password.
              </p>
            </div>

            {/* Sucess / Error Message */}
            {(error || success) && (
              <div
                className={`rounded-md ${error ? "bg-red-50" : "bg-green-50"} p-4`}
              >
                <p
                  className={`text-center text-sm font-medium ${error ? "text-red-800" : "text-green-800"}`}
                >
                  {error || success}
                </p>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="text-light block text-sm font-medium leading-6"
                >
                  Email
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="focus:ring-primary text-light block w-full rounded-md border-0 bg-charleston py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primarydark focus-visible:outline-primary flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            <a
              href="/signin"
              className="text-primarydark  hover:text-primary font-semibold"
            >
              Return to login
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
