import { Privacy } from "./privacy";
import { Organizations } from './organizations';
import { CombinedUserData } from './combined_user_data';

// Certificate settings (from current event.ts)
export interface CertificateSettings {
  certificate_enabled: boolean;
  release_option: "disabled" | "immediate" | "after_event" | "scheduled";
  scheduled_release_date?: Date | null;
}

// Main Event interface (merged from both files)
export interface Event {
  // Primary identifier
  id: string;
  eventid?: string;  // Legacy support if needed internally
  
  // Organization
  organizationid: string;
  adminid?: string;
  
  // Basic info
  title: string;
  description: string;
  eventslug: string;
  tags?: string[];
  
  // Dates
  starteventdatetime: string;
  endeventdatetime: string;
  createdat?: Date | string;
  
  // Details
  location?: string;
  registrationfee?: number | null;
  capacity?: number | null;
  onsite?: boolean;
  
  // Media
  eventphoto?: string | null;
  imageUrl?: string | null;
  
  // Status & settings
  status?: string;
  manualstatus?: boolean;
  privacy?: Privacy;
  
  // Feedback & certificates
  has_feedback_form?: boolean;
  certificate_enabled?: boolean;
  release_option?: "disabled" | "immediate" | "after_event" | "scheduled";
  scheduled_release_date?: string | Date | null;
  
  // Relations
  organizations?: Organizations;
  combined_user_data?: CombinedUserData;
  users?: never[];
  selected?: boolean;
}

export type Events = Event;  // Backwards compatibility