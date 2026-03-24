export interface Organization {
  /** Primary identifier (Supabase PK) */
  organizationid: string; // UUID from Supabase

  /** Human-readable info */
  name: string;
  slug: string;
  description?: string;

  /** Metadata */
  adminid?: string;
  created_at?: string; // Supabase timestamp
  date_established?: string; // date in ISO string

  /** Classification */
  organization_type?: string;
  industry?: string;
  organization_size?: string;

  /** Media */
  photo?: string | null;
  banner?: string | null;

  /** Social / stats */
  website?: string;
  address?: Record<string, any>; // JSON column
  socials?: Record<string, any>; // JSON column
  total_members?: number;
  total_posts?: number;
  total_events?: number;

  /** Organization access */
  organization_access?: string;
}
