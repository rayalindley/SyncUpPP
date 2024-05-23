import Header from "@/components/dashboard/Header";
import SideNavMenuForUsers from "@/components/dashboard/SideNavMenuForUsers";
import { fetchOrganizationsForUser } from "@/lib/organization";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getUser();

  if (!user) {
    return redirect("/signin");
  }

  const organizations = await fetchOrganizationsForUser(user.id);

  return (
    <div className="">
      <SideNavMenuForUsers organizations={organizations.data || []} />
      <div className="lg:pl-72">
        <Header user={user} />
        <main className="bg-gray pb-10 ">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
