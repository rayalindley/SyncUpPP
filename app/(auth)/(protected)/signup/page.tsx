"use client";

import React, { Component } from "react";
import SignUpController from "@/controllers/signUpController";

interface SignUpProps {
  searchParams: {
    error?: string;
    success?: string;
  };
}

class SignUp extends Component<SignUpProps> {
  private signUpController: SignUpController;

  constructor(props: SignUpProps) {
    super(props);
    this.signUpController = new SignUpController();
  }

  handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await this.signUpController.signUp(formData);
  };

  render() {
    const { searchParams } = this.props;

    return (
      <div className="flex min-h-full flex-1 flex-col justify-center bg-eerieblack py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img className="mx-auto h-10 w-auto" src="Symbian.png" alt="SyncUp" />
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-light">
            Sign up to create your account.
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="m-3 rounded-lg bg-charleston px-6 py-12 shadow sm:px-12">
            {(searchParams?.error || searchParams?.success) && (
              <div
                className={`rounded-md ${searchParams.error ? "bg-red-50" : "bg-green-50"} p-4`}
              >
                <p
                  className={`text-center text-sm font-medium ${
                    searchParams?.error ? "text-red-800" : "text-green-800"
                  }`}
                >
                  {searchParams?.error} {searchParams?.success}
                </p>
              </div>
            )}
            <form onSubmit={this.handleSignUp} className="space-y-3">
              <div className="mt-3 flex w-full justify-between gap-2">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block bg-charleston text-sm font-medium leading-6 text-light"
                  >
                    First Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      autoComplete="first_name"
                      required
                      className="block w-full rounded-md border-0 bg-charleston py-1.5 text-light shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-light autofill:bg-charleston autofill:text-light focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="block bg-charleston text-sm font-medium leading-6 text-light"
                  >
                    Last Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      autoComplete="last_name"
                      required
                      className="block w-full rounded-md border-0 bg-charleston py-1.5 text-light shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-light autofill:bg-charleston autofill:text-light focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-light"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border-0 bg-charleston py-1.5 text-light shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block bg-charleston text-sm font-medium leading-6 text-light"
                >
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-md border-0 bg-charleston py-1.5 text-light shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="agree_checkbox"
                  name="agree_checkbox"
                  required
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="agree_checkbox"
                  className="ml-3 block text-sm leading-6 text-light"
                >
                  I agree with all the <a href="#">terms and conditions</a>
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Sign up
                </button>
              </div>
            </form>

            <div>
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-charleston px-3 text-light">Or continue with</span>
                </div>
              </div>

              <form className="mt-6 grid gap-4">
                <button
                  type="submit"
                  formAction={async () => {
                    await this.signUpController.signInWith("google");
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
                >
                  <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  <span className="text-sm font-semibold leading-6">Google</span>
                </button>
              </form>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/signin"
              className="font-semibold leading-6 text-primary hover:text-primarydark"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    );
  }
}

export default SignUp;
