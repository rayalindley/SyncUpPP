import { SupabaseClient } from "@supabase/supabase-js";
import { Notifications as Notification } from "../types/notifications";

export class NotificationService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createNotification(notification: Notification): Promise<Notification> {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Notification;
  }

  async getNotificationById(
    notificationId: string
  ): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("notificationid", notificationId)
      .single();
    if (error) return null;
    return data as Notification;
  }

  async updateNotification(
    notificationId: string,
    updates: Partial<Notification>
  ): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .update(updates)
      .eq("notificationid", notificationId)
      .select()
      .single();
    if (error) return null;
    return data as Notification;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .delete()
      .eq("notificationid", notificationId);
    if (error) throw new Error(error.message);
  }
}
