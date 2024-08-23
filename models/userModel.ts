import { SupabaseClient } from "@supabase/supabase-js";

class UserModel {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public async getUserSession() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      throw new Error(`Error getting session: ${error.message}`);
    }
    return data;
  }

  public async updateUser(password: string) {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }
}

export default UserModel;
