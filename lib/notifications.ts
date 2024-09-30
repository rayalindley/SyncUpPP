"use client";
import { createClient } from "@/lib/supabase/client";
import { Notifications } from "@/types/notifications";

export async function fetchNotifications(userId: string) {
  const supabase = createClient();
  try {
    let { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("userid", userId)
      .order("date_created", { ascending: false }); // Changed from "created_on"
    if (!error) {
      if (data !== null) {
        const unreadCount = data.filter(
          (notification: Notifications) => !notification.read // Changed from !notification.isread
        ).length;
        return { data, unreadCount, error: null };
      } else {
        return { data: null, unreadCount: 0, error: null };
      }
    } else {
      return { data: null, unreadCount: 0, error: { message: error.message } };
    }
  } catch (e) {
    return {
      data: null,
      unreadCount: 0,
      error: {
        message: (e as Error).message || "An unexpected error occurred",
      },
    };
  }
}

export async function markAllAsRead(userId: string) {
  const supabase = createClient();
  try {
    let { error } = await supabase
      .from("notifications")
      .update({ read: true }) // Changed from isread
      .eq("userid", userId)
      .eq("read", false); // Changed from isread
    if (!error) {
      return { success: true, error: null };
    } else {
      return { success: false, error: { message: error.message } };
    }
  } catch (e) {
    return {
      success: false,
      error: {
        message: (e as Error).message || "An unexpected error occurred",
      },
    };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient();
  try {
    let { error } = await supabase
      .from("notifications")
      .update({ read: true }) // Changed from isread
      .eq("notificationid", notificationId);
    if (!error) {
      return { success: true, error: null };
    } else {
      return { success: false, error: { message: error.message } };
    }
  } catch (e) {
    return {
      success: false,
      error: {
        message: (e as Error).message || "An unexpected error occurred",
      },
    };
  }
}
