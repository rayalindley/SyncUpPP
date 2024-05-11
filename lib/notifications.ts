"use server";
import { createClient } from "@/lib/supabase/server";

// Fetch notifications for the user
export async function fetchNotifications(userId) {
  const supabase = createClient();
  try {
    let { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userid', userId)
      .order('created_on', { ascending: false })

    if (!error) {
      // Count unread notifications
      const unreadCount = data.filter(notification => !notification.isread).length;
      // Return data with unread count
      return { data, unreadCount, error: null };
    } else {
      return { data: null, unreadCount: 0, error: { message: error.message } };
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return {
      data: null,
      unreadCount: 0,
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}

// Mark all notifications as read for the user
export async function markAllAsRead(userId) {
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
      error: { message: e.message || "An unexpected error occurred" },
    };
  }
}
