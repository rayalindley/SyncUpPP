import { redirect } from "next/navigation";

import Header from "@/components/dashboard/Header";
import SideNavMenuForAdmins from "@/components/dashboard/SideNavMenuForAdmins";
import SideNavMenuForUsers from "@/components/dashboard/SideNavMenuForUsers";
import { UserProvider } from "@/context/UserContext";
import { fetchOrganizationsForUser } from "@/lib/organization";
import { getUser } from "@/lib/supabase/server";

export default async function DashboardLayout({
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
    <UserProvider>
      <div className="">
        {user.role === "superadmin" ? (
          <SideNavMenuForAdmins />
        ) : (
          organizations &&
          organizations.data && <SideNavMenuForUsers organizations={organizations.data} />
        )}
        <div className="lg:pl-72">
          <Header user={user} />
          <main className="bg-gray py-10">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}

// ^ we may add or wrap more components above if necessary
