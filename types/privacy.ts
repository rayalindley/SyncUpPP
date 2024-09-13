export interface Privacy {
  type: "public" | "private"; // Only 'public' or 'private' are valid types
  roles?: string[]; // Optional array of roles if privacy is 'private'
  membership_tiers?: string[]; // Optional array of membership tiers if privacy is 'private'
  allow_all_roles?: boolean; // Optional boolean for allowing all roles
  allow_all_memberships?: boolean; // Optional boolean for allowing all memberships
}
