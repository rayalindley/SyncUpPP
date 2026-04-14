import { createClient } from "@/lib/supabase/server";
import { recordActivity } from "@/lib/track";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth exchange error:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
      }

      try {
        await recordActivity({
          activity_type: "user_signin",
          description: "User signed in",
        });
      } catch (trackErr) {
        console.error("recordActivity failed:", trackErr);
      }
    } catch (err) {
      console.error("Callback handler error:", err);
      return NextResponse.redirect(`${origin}/login?error=server_error`);
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}