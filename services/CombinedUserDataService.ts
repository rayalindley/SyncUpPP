// services/CombinedUserDataService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { CombinedUserData } from "../models/CombinedUserData";

export class CombinedUserDataService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async getCombinedUserDataById(userId: string): Promise<CombinedUserData | null> {
    const { data, error } = await this.supabase.rpc("get_combined_user_data_by_id", {
      user_id: userId,
    });
    if (error) return null;
    return new CombinedUserData(
      data.id,
      data.email,
      data.role,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.first_name,
      data.last_name,
      data.gender,
      new Date(data.dateofbirth),
      data.description,
      data.company,
      data.website,
      new Date(data.updatedat)
    );
  }
}
