// @/services/AuthService.ts

import { createClient } from "../lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { User } from "../models/User";
import { z } from "zod";

import { Provider } from "@supabase/supabase-js";
import { recordActivity } from "@/lib/track";

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters long" }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters long" }),
});

export class AuthService {
  private supabase = createClient();

  async signOut() {

    await recordActivity({
      activity_type: "user_signout",
      description: "User signed out",
    });

    await this.supabase.auth.signOut();
    return redirect("/signin");
  }

  async signInWithPassword(email: string, password: string) {
    const result = signInSchema.safeParse({ email, password });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      return redirect(`/signin?error=${errors}`);
    }

    const { error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return redirect(`/signin?error=${error.message || "Invalid email or password"}`);
    }

    const referer = headers().get("referer");
    if (
      referer &&
      !referer.includes("/signin") &&
      !referer.includes("/signup") &&
      !referer.includes("/")
    ) {

      await recordActivity({
        activity_type: "user_signin",
        description: "User signed in",
      });

      return redirect(referer);
    }

    return redirect("/dashboard");
  }

  async signUp(user: User) {
    const result = signUpSchema.safeParse({
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      return redirect(`/signup?error=${errors}`);
    }

    const { email, password, firstName, lastName } = result.data;
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });

    if (error) {
      return redirect(`/signup?error=${error.message || "Could not sign up"}`);
    }

    const referer = headers().get("referer");
    if (
      referer &&
      !referer.includes("/signin") &&
      !referer.includes("/signup") &&
      !referer.includes("/")
    ) {
      await recordActivity({
        activity_type: "user_signup",
        description: "User signed up",
      });
      return redirect(referer);
    }

    return redirect("/signup?success=Check your email to continue signing up.");
  }

  async signInWithProvider(provider: Provider) {
    const origin = headers().get("origin");
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${origin}/api/auth/callback` },
    });

    if (error) {
      return redirect(`/signin?error=${error.message || "Could not authenticate user"}`);
    }

    return redirect(data.url);
  }

  async forgotPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return redirect(
        `/forgot-password?error=${error.message || "Could not send email."}`
      );
    }

    return redirect(
      `/forgot-password?success=Check your inbox for instructions to reset your password.`
    );
  }

  async resetPassword(password: string) {
    const { error } = await this.supabase.auth.updateUser({ password });

    if (error) {
      return redirect(
        `/reset-password?error=${error.message || "Could not reset password."}`
      );
    } else {
      //record activity
      await recordActivity({
        activity_type: "user_reset_password",
        description: "User reset password",
      });
    }

    return redirect("/dashboard?success=Password reset successfully.");
  }
}
