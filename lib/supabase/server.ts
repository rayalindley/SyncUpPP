import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {}
        },
      },
    }
  );
};

const createAdminClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

export async function getUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data;
}

export async function getAllUsers() {
  const supabase = createAdminClient(); 
  const { data: { users }, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (!error) return users;
  return;
}

export async function sendPasswordRecovery(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/confirm?next=/reset-password`,
  });
  if (!error) return data;
  return;
}