import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!,

    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

export async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return data;
}

export async function getAllUsers() {
  const supabase = createClient();
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (!error) {
    return users;
  }

  return;
}

export async function sendPasswordRecovery(email: string) {
  const supabase = createClient();
  let { data, error } = await supabase.auth.resetPasswordForEmail(email);

  if (!error) {
    // console.log("sendPasswordRecovery", data);
    return data;
  }

  return;
}
