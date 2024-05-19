"use server";
import { createClient } from "@/lib/supabase/server";

// Fetch notifications for the user
export async function fetchNotifications(userId: string) {
  const supabase = createClient();
  try {
    let { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userid', userId)
      .order('created_on', { ascending: false })

    if (!error) {
      // Check if data is not null
      if (data !== null) {
        // Count unread notifications
        const unreadCount = data.filter(notification => !notification.isread).length;
        // Return data with unread count
        return { data, unreadCount, error: null };
      } else {
        return { data: null, unreadCount: 0, error: null };
      }
    } else {
      return { data: null, unreadCount: 0, error: { message: error.message } };
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      unreadCount: 0,
      error: { message: (e as Error).message || "An unexpected error occurred" },
    };
  }
}

// Mark all notifications as read for the user
export async function markAllAsRead(userId: string) {
  const supabase = createClient();
  try {
    let { error } = await supabase
      .from('notifications')
      .update({ isread: true })
      .eq('userid', userId)
      .eq('isread', false);

    if (!error) {
      return { success: true, error: null };
    } else {
      return { success: false, error: { message: error.message } };
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return {
      success: false,
      error: { message: (e as Error).message || "An unexpected error occurred" },
    };
  }
}

// Mark a single notification as read for the user
export async function markNotificationAsRead(notificationId: any) {
  const supabase = createClient();
  try {
    let { error } = await supabase
      .from('notifications')
      .update({ isread: true })
      .eq('notificationid', notificationId);

    if (!error) {
      return { success: true, error: null };
    } else {
      return { success: false, error: { message: error.message } };
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return {
      success: false,
      error: { message: (e as Error).message || "An unexpected error occurred" },
    };
  }
}
