// Filename: D:\Github\SyncUp\lib\notify.ts

"use client";
import { createClient } from "@/lib/supabase/client";

interface NotifyPayload {
  userId: string;
  title: string;
  message: string;
  type?: string; // Defaults to 'general' if not provided
  metadata?: Record<string, any>; // Stores additional info based on notification type
  path?: string | null; // URL or path related to the notification
  date?: Date; // Defaults to current date/time if not provided
  read?: boolean; // Defaults to false if not provided
}

interface NotifyResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
  };
}

/**
 * Creates a new notification.
 *
 * @param payload - The notification details.
 * @returns An object indicating success or failure, along with relevant data or error message.
 */
export async function notify(payload: NotifyPayload): Promise<NotifyResponse> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.from("notifications").insert([
      {
        userid: payload.userId, // Changed from 'user_id' to 'userid'
        title: payload.title,
        message: payload.message,
        type: payload.type || "general",
        metadata: payload.metadata || {},
        path: payload.path || null, // Changed from 'url' to 'path'
        date_created: payload.date || new Date(),
        read: payload.read ?? false, // Changed from 'isread' to 'read'
      },
    ]);

    if (error) {
      console.error("Error inserting notification:", error);
      return { success: false, error: { message: error.message } };
    }

    return { success: true, data };
  } catch (e) {
    console.error("Unexpected error inserting notification:", e);
    return {
      success: false,
      error: {
        message: (e as Error).message || "An unexpected error occurred",
      },
    };
  }
}

// Usage:
// import { notify } from "@/lib/notify";

// /**
//  * Example function to notify a user about joining an event.
//  *
//  * @param userId - The ID of the user to notify.
//  * @param eventTitle - The title of the event.
//  * @param eventDate - The date of the event.
//  * @param eventLocation - The location of the event.
//  * @param eventId - The ID of the event.
//  * @param eventUrl - The URL to the event page.
//  */
// export async function notifyUserJoinedEvent(
//   userId: string,
//   eventTitle: string,
//   eventDate: string,
//   eventLocation: string,
//   eventId: string,
//   eventUrl: string
// ) {
//   const result = await notify({
//     userId,
//     title: `You’ve joined the event: ${eventTitle}`,
//     message: `Thanks for joining the event. Here are the details: "${eventTitle}" on ${eventDate} at ${eventLocation}.`,
//     type: "event_registration",
//     metadata: {
//       eventId,
//       eventTitle,
//       eventDate,
//       eventLocation,
//     },
//     path: `/events/${eventId}`, // Link to the event page within your application
//   });

//   if (!result.success) {
//     // Handle the error appropriately
//     console.error("Failed to send notification:", result.error?.message);
//   }
// }
