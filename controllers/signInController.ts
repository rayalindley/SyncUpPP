import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import UserModel from "@/models/userModel"; 

class SignInController {
  private request: NextRequest;
  private response: NextResponse;
  private supabase: SupabaseClient;
  private userModel: UserModel;

  constructor(request: NextRequest) {
    this.request = request;
    this.response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    this.userModel = new UserModel(this.supabase); // Instantiate UserModel with SupabaseClient
  }

  private getCookie(name: string): string | undefined {
    return this.request.cookies.get(name)?.value;
  }

  private setCookie(name: string, value: string, options: any): void {
    // Update the request and response cookies
    this.request.cookies.set({
      name,
      value,
      ...options,
    });
    this.response = NextResponse.next({
      request: {
        headers: this.request.headers,
      },
    });
    this.response.cookies.set({
      name,
      value,
      ...options,
    });
  }

  private removeCookie(name: string, options: any): void {
    // Remove the cookie and update the request and response cookies
    this.request.cookies.set({
      name,
      value: "",
      ...options,
    });
    this.response = NextResponse.next({
      request: {
        headers: this.request.headers,
      },
    });
    this.response.cookies.set({
      name,
      value: "",
      ...options,
    });
  }

  public async updateSession(): Promise<NextResponse> {
    // Call the userModel instance to get the user session
    const sessionData = await this.userModel.getUserSession();

    // Optionally, you could use sessionData here, for now, just return the response
    return this.response;
  }
}

export default SignInController;
