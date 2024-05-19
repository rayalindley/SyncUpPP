// custom types for supabase
// ./types/userProfile.ts

export type Email = {
  [key: string]: any;
  id: number;
  sender: string;
  receiver: string;
  subject: string;
  body: string;
  status: string;
  date_created: Date;
};

export type Address = {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
};

export type Socials = {
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
};

export type Organization = {
  organizationid: string;
  name: string;
  description: string;
  adminid: string;
  created_at: Date;
  organization_type: string;
  industry: string;
  organization_size: string;
  website: string;
  date_established: Date;
  address: Address;
  socials: Socials;
  slug: string;
  photo: string;
  banner: string;
};

// Define the Event type based on the provided schema
export type Event = {
  eventid: string;
  organizationid: string;
  title: string;
  description: string;
  eventdatetime: string;
  location: string;
  registrationfee: number;
  createdat: string;
  capacity: number;
  adminid: string;
  privacy: string;
  eventphoto: string;
  tags: string[];
  eventslug: string;
  selected?: boolean; // Optional property to track selection state
}

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
}

// ./types/combinedUserData.ts
export type CombinedUserData = {
  id?: string
  email?: string
  role?: string
  created_at?: Date
  updated_at?: Date
  first_name?: string
  last_name?: string
  gender?: string
  dateofbirth?: Date
  description?: string
  company?: string
  website?: string
  updatedat?: Date
}

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
