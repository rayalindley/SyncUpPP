import { User } from "@supabase/supabase-js";

export interface UserProfileData {
  first_name: string;
  last_name: string;
}

export interface UserProfile {
  data: UserProfileData;
}

export interface UserTableData {
  userProfile: UserProfile;
  user: User;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export interface UsersTableProps {
  users: User[];
  userProfiles: UserProfile[];
}
