"use client";

import { createClient } from "@/lib/supabase/client";
import { UserModel } from "@/models/userModel";

export class AuthController {
  private userModel = new UserModel();

  async handleSignUp(formData: FormData) {
    const result = this.userModel.validateSignUp({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      alert(errors);
      return;
    }

    const { email, password, first_name, last_name } = result.data;
    try {
      await this.userModel.createUser(email, password, first_name, last_name);
      window.location.href = "/signup?success=Check your email to continue signing up.";
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message || "Could not sign up.");
      } else {
        alert("An unknown error occurred.");
      }
    }
  }

  async signInWith(provider: "google" | "github") {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
      });

      if (error) {
        alert(error.message || "Could not authenticate user.");
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      alert("An error occurred during sign-in.");
    }
  }

  async signInWithPassword(formData: FormData) {
    const result = this.userModel.validateSignIn({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      alert(errors);
      return;
    }

    const { email, password } = result.data;
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message || "Invalid email or password.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      alert("An error occurred during sign-in.");
    }
  }

  async forgotPassword(formData: FormData) {
    const result = this.userModel.validateForgotPassword({
      email: formData.get("email") as string,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      alert(errors);
      return;
    }

    const { email } = result.data;
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        alert(error.message || "Could not send email.");
      } else {
        window.location.href = "/forgot-password?success=Check your inbox for instructions to reset your password.";
      }
    } catch (error) {
      alert("An error occurred during the password reset process.");
    }
  }

  async signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/signin";
    } catch (error) {
      alert("An error occurred during sign-out.");
    }
  }
}
