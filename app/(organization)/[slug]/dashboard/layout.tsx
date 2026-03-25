import Header from "@/components/dashboard/header";
import SideNavMenuForUsers from "@/components/dashboard/side_nav_menu_for_users";
import { fetchOrganizationsForUser, fetchOrganizationsForUserWithViewPermission } from "@/lib/organization";
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

  const organizations = await fetchOrganizationsForUserWithViewPermission(user.id);

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
