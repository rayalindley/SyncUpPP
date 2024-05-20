import { UserProvider } from "@/context/UserContext";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage({
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
      <main className="bg-gray">
        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </UserProvider>
  );
}
