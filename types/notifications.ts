// Filename: D:\Github\SyncUp\types\notifications.ts

export interface Notifications {
  notificationid: string;
  userid: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, any>; // Stores additional info based on notification type
  path?: string;
  date_created: string; // Changed from 'created_on'
  read: boolean; // Changed from 'isread'
}
