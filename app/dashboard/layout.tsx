import { redirect } from "next/navigation";

import { UserProvider } from "@/context/UserContext";
import { getUser } from "@/lib/supabase/server";
import SideNavMenuForAdmins from "@/components/dashboard/SideNavMenuForAdmins";
import SideNavMenuForUsers from "@/components/dashboard/SideNavMenuForUsers";
import Header from "@/components/dashboard/Header";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getUser();

  if (!user) {
    return redirect("/signin");
  }

  // console.log(user.role);
  return (
    <UserProvider>
      <div className="">
        {user.role === "superadmin" ? <SideNavMenuForAdmins /> : <SideNavMenuForUsers />}

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
