import StatisticSection from "@/components/app/Statistics";
import { getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  return (
    <>
      <StatisticSection />

      <div className="mt-10">
        <h3 className="text-base font-semibold leading-6 text-gray-300">Organizations</h3>
        <div className="isolate mx-auto mt-5 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl xl:mx-0 xl:max-w-none xl:grid-cols-4">
          {/* ! Map User's Organizations here. */}
          <div className={"rounded-xl bg-[#232323] p-5 ring-1 ring-[#343434]"}>
            <h2 className={"text-lg font-semibold leading-8 text-gray-300"}>
              Organization Name
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus, molestiae.
            </p>
          </div>

          <div className={"rounded-xl bg-[#232323] p-5 ring-1 ring-[#343434]"}>
            <h2 className={"text-lg font-semibold leading-8 text-gray-300"}>
              Organization Name
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus, molestiae.
            </p>
          </div>
        </div>
      </div>

      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
    </>
  );
}
