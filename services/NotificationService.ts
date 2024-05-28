// services/NotificationService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Notification } from "../models/Notification";

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
    return new Notification(
      data.notificationId,
      data.organizationMemberId,
      data.eventId,
      data.title,
      new Date(data.eventDateTime),
      data.orgName,
      data.isRead,
      data.userId,
      data.message,
      new Date(data.createdOn),
      data.type,
      data.path
    );
  }

  async getNotificationById(notificationId: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("notificationId", notificationId)
      .single();
    if (error) return null;
    return new Notification(
      data.notificationId,
      data.organizationMemberId,
      data.eventId,
      data.title,
      new Date(data.eventDateTime),
      data.orgName,
      data.isRead,
      data.userId,
      data.message,
      new Date(data.createdOn),
      data.type,
      data.path
    );
  }

  async updateNotification(
    notificationId: string,
    updates: Partial<Notification>
  ): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from("notifications")
      .update(updates)
      .eq("notificationId", notificationId)
      .select()
      .single();
    if (error) return null;
    return new Notification(
      data.notificationId,
      data.organizationMemberId,
      data.eventId,
      data.title,
      new Date(data.eventDateTime),
      data.orgName,
      data.isRead,
      data.userId,
      data.message,
      new Date(data.createdOn),
      data.type,
      data.path
    );
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .delete()
      .eq("notificationId", notificationId);
    if (error) throw new Error(error.message);
  }
}
