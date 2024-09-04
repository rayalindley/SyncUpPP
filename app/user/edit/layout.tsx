import { redirect } from "next/navigation";
import { UserProvider } from "@/context/user_context";
import { getUser } from "@/lib/supabase/server";

export default async function EditProfileLayout({
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
      <main className="bg-gray py-10">
        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </UserProvider>
  );
}

// ^ we may add or wrap more components above if necessary
