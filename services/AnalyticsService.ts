// services/AnalyticsService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { AnalyticsData } from "../models/AnalyticsData";

export class AnalyticsService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async fetchAnalyticsData(organizationid: string): Promise<AnalyticsData[]> {
    const { data, error } = await this.supabase
      .from("analytics_dashboard")
      .select("*")
      .eq("organizationid", organizationid);

    if (error) {
      throw new Error(error.message);
    }

    return data.map((item: any) => ({
      ...item,
      day_joined: new Date(item.day_joined)
        .toLocaleString("en-CA", {
          timeZone: "Asia/Manila",
        })
        .split(",")[0],
      day_registered: item.day_registered
        ? new Date(item.day_registered)
            .toLocaleString("en-CA", {
              timeZone: "Asia/Manila",
            })
            .split(",")[0]
        : null,
    }));
  }
}
