import { redirect } from "next/navigation";

import Header from "@/components/dashboard/Header";
import { UserProvider } from "@/context/UserContext";
import { getUser } from "@/lib/supabase/server";

export default async function NewsletterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getUser();

  if (!user) {
    return redirect("/signin");
  }

  return (
    <UserProvider>
      <div className="">
          <Header user={user} />

          <main className="bg-gray py-10">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
      </div>
    </UserProvider>
  );
}

// ^ we may add or wrap more components above if necessary
