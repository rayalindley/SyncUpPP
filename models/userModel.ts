"use client";

import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

export class UserModel {
  private email: string;
  private password: string;
  private firstName?: string;
  private lastName?: string;

  constructor(email?: string, password?: string, firstName?: string, lastName?: string) {
    this.email = email || "";
    this.password = password || "";
    this.firstName = firstName;
    this.lastName = lastName;
  }

  // Getters and Setters for each attribute
  public getEmail(): string {
    return this.email;
  }

  public setEmail(email: string): void {
    this.email = email;
  }

  public getPassword(): string {
    return this.password;
  }

  public setPassword(password: string): void {
    this.password = password;
  }

  public getFirstName(): string | undefined {
    return this.firstName;
  }

  public setFirstName(firstName: string): void {
    this.firstName = firstName;
  }

  public getLastName(): string | undefined {
    return this.lastName;
  }

  public setLastName(lastName: string): void {
    this.lastName = lastName;
  }

  // Validation Methods
  public validateSignUp(data: { email: string; password: string; first_name: string; last_name: string }) {
    const schema = z.object({
      email: z.string().email({ message: "Invalid email format" }),
      password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
      first_name: z.string().min(2, { message: "First name must be at least 2 characters long" }),
      last_name: z.string().min(2, { message: "Last name must be at least 2 characters long" }),
    });

    return schema.safeParse(data);
  }

  public validateSignIn(data: { email: string; password: string }) {
    const schema = z.object({
      email: z.string().email({ message: "Invalid email format" }),
      password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
    });

    return schema.safeParse(data);
  }

  public validateForgotPassword(data: { email: string }) {
    const schema = z.object({
      email: z.string().email({ message: "Invalid email format." }),
    });

    return schema.safeParse(data);
  }

  // Supabase Interaction
  public async createUser(email: string, password: string, firstName: string, lastName: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (error) throw new Error(error.message);
  }
}
