"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import UserModel from "@/models/userModel";

// Initialize Supabase client for client-side usage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  first_name: z.string().min(2, { message: "First name must be at least 2 characters long" }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters long" }),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email format." }),
});

class SignUpController {
  private supabase = supabase; // Use the initialized Supabase client
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel(this.supabase); // Pass the client to the UserModel
  }

  public async signOut(): Promise<void> {
    const router = useRouter();
    await this.userModel.getUserSession(); // Example of how you might use the model
    await this.supabase.auth.signOut();
    router.push("/signin");
  }

  public async signInWithPassword(formData: FormData): Promise<void> {
    const router = useRouter();

    const result = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      alert(errors);
      return;
    }

    const { email, password } = result.data;
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message || "Invalid email or password");
      return;
    }

    router.push("/dashboard");
  }

  public async signUp(formData: FormData): Promise<void> {
    const router = useRouter();

    const result = signUpSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      alert(errors);
      return;
    }

    const { email, password, first_name, last_name } = result.data;
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        },
      },
    });

    if (error) {
      alert(error.message || "Could not sign up");
      return;
    }

    router.push("/signup?success=Check your email to continue signing up.");
  }

  public async signInWith(provider: "github" | "google"): Promise<void> {
    const router = useRouter();

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      alert(error.message || "Could not authenticate user");
      return;
    }

    router.push(data.url);
  }

  public async forgotPassword(formData: FormData): Promise<void> {
    const router = useRouter();

    const result = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      alert(errors);
      return;
    }
    const { email } = result.data;

    const { error } = await this.supabase.auth.resetPasswordForEmail(email);

    if (error) {
      alert(error.message || "Could not send email.");
      return;
    }

    router.push("/forgot-password?success=Check your inbox for instructions to reset your password.");
  }

  public async resetPassword(formData: FormData): Promise<void> {
    const router = useRouter();

    const result = resetPasswordSchema.safeParse({
      password: formData.get("password"),
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      alert(errors);
      return;
    }

    try {
      await this.userModel.updateUser(result.data.password);
    } catch (error) {
      let errorMessage = "Could not reset password.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(errorMessage);
      return;
    }

    router.push("/dashboard?success=Password reset successfully.");
  }
}

// Export the class as the default export
export default SignUpController;
