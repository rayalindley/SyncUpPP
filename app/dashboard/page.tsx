import { signOut } from "@/lib/auth";
import { getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getUser();

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p>
          Test route to check currently logged-in user. This route is also protected via
          layout.tsx.
        </p>
        <p>Only authenticated users can access.</p>
      </div>
      <form action={signOut}>
        Logout here, via signOut server action:{" "}
        <button className="rounded-md bg-blue-600 px-4 py-2 hover:bg-blue-400">
          Logout
        </button>
      </form>
      user object: <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
