export interface Organization {
  id: string;
  selected?: boolean;
  organization_id: string;
  organizationid: string;
  name: string;
  description: string;
  created_at: Date;
  organization_type: string;
  organization_size: number;
  photo: string;
  banner: string;
  slug: string;
  socials: string[];
  total_members: number;
  total_posts: number;
  date_established: string;
  industry: string;
  total_events: number;
}
