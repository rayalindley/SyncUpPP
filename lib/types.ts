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
  // membershipname: string;
  name: string;
  membershipid: string;
  organizationid: string;
  description: string;
  registrationfee: number;
  features: string[];
  mostPopular: boolean;
  type: string;
  months: number;
}

export interface MembershipsProps {
  memberships: Membership[];
  userid: string;
}
