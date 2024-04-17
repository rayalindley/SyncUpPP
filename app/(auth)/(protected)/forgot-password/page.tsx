import { forgotPassword } from "@/lib/auth";

export default function ForgotPassword({ searchParams }: { searchParams: any }) {
  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center bg-eerieblack py-12 sm:px-6 lg:px-8">
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="m-3 rounded-lg bg-charleston px-6 py-12 shadow sm:px-12">
            <div className="mb-6 sm:mx-auto sm:w-full sm:max-w-md">
              <img className="mx-auto h-10 w-auto" src="Symbian.png" alt="SyncUp" />
              <h2 className="mt-3 text-center text-2xl font-bold leading-9 tracking-tight text-chinawhite">
                Reset your password
              </h2>
              <p className="text-center text-sm text-chinawhite">
                Enter your email to receive instructions on how to reset your password.
              </p>
            </div>

            {/* Sucess / Error Message */}
            {(searchParams?.error || searchParams?.success) && (
              <div
                className={`rounded-md ${searchParams.error ? "bg-red-50" : "bg-green-50"} p-4`}
              >
                <p
                  className={`text-center text-sm font-medium ${searchParams?.error ? "text-red-800" : "text-green-800"}`}
                >
                  {searchParams?.error} {searchParams?.success}
                </p>
              </div>
            )}

            <form action={forgotPassword} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-chinawhite"
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
                    className="block w-full rounded-md border-0 bg-charleston py-1.5 text-chinawhite shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-junglegreen sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-darkjunglegreen px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-junglegreen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-junglegreen"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            <a
              href="/signin"
              className="font-semibold  text-darkjunglegreen hover:text-junglegreen"
            >
              Return to login
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
