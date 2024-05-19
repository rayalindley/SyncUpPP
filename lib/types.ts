// custom types for supabase
// ./types/userProfile.ts

export type UserProfile = {
  userid?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  profilepicture?: string | undefined; // Now a string to store the URL
  website?: string;
  updatedat?: Date;
};

// ./types/combinedUserData.ts
export type CombinedUserData = {
  id?: string;
  email?: string;
  role?: string;
  created_at?: Date;
  updated_at?: Date;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: Date;
  description?: string;
  company?: string;
  website?: string;
  updatedat?: Date;
};

export interface Membership {
  membershipid: string;
  organizationid: string;
  name: string;
  description: string;
  registrationfee: number;
  features?: string[];
  mostPopular?: boolean;
}

export interface MembershipsProps {
  memberships: Membership[];
}

export interface Event {
  eventid: string;
  eventphoto: string;
  title: string;
  description: string;
  registrationfee: number;
  eventdatetime: Date;
  location: string;
  capacity: number;
  organizationid: string;
  eventslug: string;
  imageUrl: string;
  tags: string[];
  privacy: string;
}

export interface Organization {
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
}
