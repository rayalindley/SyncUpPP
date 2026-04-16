// pages/api/auth/signup.ts

import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must contain at least one special character",
    }),
  first_name: z.string().min(2, { message: "First name must be at least 2 characters long" }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters long" }),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = signUpSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((i) => i.message).join(", ");
    return res.status(400).json({ error: errors });
  }

  const { email, password, first_name, last_name } = result.data;

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name, last_name },
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message || "Could not sign up" });
  }

  return res.status(201).json({ success: true });
}