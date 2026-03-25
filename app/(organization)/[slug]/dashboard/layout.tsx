import Header from "@/components/dashboard/header";
import SideNavMenuForUsers from "@/components/dashboard/side_nav_menu_for_users";
import { fetchOrganizationsForUserWithViewPermission } from "@/lib/organization";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getUser();

  if (!user) {
    redirect("/signin");
  }

  const organizations = await fetchOrganizationsForUserWithViewPermission(user.id);

  return (
    <div className="flex w-full min-h-screen bg-eerieblack">
      {/* Sidebar */}
      <SideNavMenuForUsers organizations={organizations.data || []} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-72">
        <Header user={user} />

        <main className="flex-1 w-full pb-10">
          {/* THIS is the key line */}
          <div className="w-full px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
