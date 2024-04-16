export default function ContactUs() {
  return (
    <div
      id="contactus"
      className="bg-eerieblack relative isolate px-6 py-24 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-xl lg:max-w-2xl">
        <h2 className="text-chinawhite flex text-4xl font-bold tracking-tight">
          Contact Us
        </h2>
        <p className="text-chinawhite mt-2 text-lg leading-8">
          Have questions or need assistance? Reach out to our friendly team for support,
          inquiries, or partnership opportunities. We're here to help!
        </p>
        <div className="mt-16 flex flex-col gap-16 sm:gap-y-20 lg:flex-row">
          <form action="#" method="POST" className="lg:flex-auto">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first-name"
                  className="text-chinawhite block text-sm font-semibold leading-6"
                >
                  First name
                </label>
                <div className="mt-2.5">
                  <input
                    type="text"
                    name="first-name"
                    id="first-name"
                    autoComplete="given-name"
                    className="bg-charleston text-chinawhite focus:ring-junglegreen ring-raisinblack placeholder:text-chinawhite block w-full rounded-md border-0 px-3.5 py-2 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="last-name"
                  className="text-chinawhite block text-sm font-semibold leading-6"
                >
                  Last name
                </label>
                <div className="mt-2.5">
                  <input
                    type="text"
                    name="last-name"
                    id="last-name"
                    autoComplete="family-name"
                    className="bg-charleston text-chinawhite focus:ring-junglegreen ring-raisinblack placeholder:text-chinawhite block w-full rounded-md border-0 px-3.5 py-2 shadow-sm ring-2 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="text-chinawhite block text-sm font-semibold leading-6"
                >
                  Email Address
                </label>
                <div className="mt-2.5">
                  <input
                    id="budget"
                    name="budget"
                    type="email"
                    required
                    className="bg-charleston text-chinawhite focus:ring-junglegreen ring-raisinblack placeholder:text-chinawhite block w-full rounded-md border-0 px-3.5 py-2 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="message"
                  className="text-chinawhite block text-sm font-semibold leading-6"
                >
                  Message
                </label>
                <div className="mt-2.5">
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    className="text-chinawhite focus:ring-junglegreen ring-raisinblack placeholder:text-chinawhite bg-charleston block w-full rounded-md border-0 px-3.5 py-2 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                    defaultValue={""}
                  />
                </div>
              </div>
            </div>
            <div className="mt-10">
              <button
                type="submit"
                className="bg-junglegreen hover:bg-junglegreen focus-visible:outline-junglegreen block w-full rounded-md px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Submit
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-500">
              By submitting this form, I agree to the{" "}
              <a href="#" className="text-junglegreen font-semibold">
                privacy&nbsp;policy
              </a>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
