import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/track";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Mainly for OAuth2 callbacks
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
    await recordActivity({
      activity_type: "user_signin",
      description: "User signed in",
    });
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}/dashboard`);
}
