// custom types for supabase
// ./types/userProfile.ts

export type UserProfile = {
  userid: string;
  first_name: string;
  last_name: string;
  gender: string;
  dateofbirth: string;
  description: string;
  company: string;
  profilepicture: string | undefined; // Now a string to store the URL
  website: string;
  updatedat: Date;
  // Add a new field for the File object if you plan to upload a new profile picture
  profilepictureFile?: File;
}

// ./types/combinedUserData.ts
export type CombinedUserData = {
  id: string
  email: string
  role: string
  created_at: Date
  updated_at: Date
  first_name: string
  last_name: string
  gender: string
  dateofbirth: Date
  description: string
  company: string
  website: string
  updatedat: Date
}
