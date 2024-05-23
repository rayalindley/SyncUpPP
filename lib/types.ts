// Custom Types for Supabase
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
  length?: number;
};

// ./types/combinedUserData.ts
export type CombinedUserData = {
  selected?: boolean;
  id?: string | undefined;
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
  name: string;
  description?: string | undefined;
  price?: number;
  duration?: string;
  organizationId?: string;
  registrationfee: number; // Ensure this is always a number
  yearlydiscount?: number;
  mostPopular?: boolean;
  features?: string[];
}

export interface MembershipsProps {
  memberships: Membership[];
  userid: string;
}

export type EmailContent = {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments: any[]; // Specify a more precise type for attachments if possible
};

export type AdminUuid = string; // Assuming admin UUIDs are strings
export type User = CombinedUserData; // Based on the structure, it seems User can be CombinedUserData
export type OrganizationUuid = string; // Assuming organization UUIDs are strings
export type EventUuid = string; // Assuming event UUIDs are strings

export type CreateEmailResponse = {
  data?: any; // Replace 'any' with a more specific type if possible
  error?: any; // Replace 'any' with a more specific type if possible
};

export interface Event {
  id: string;
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
  createdat: Date;
  selected?: string | boolean; // Updated type to include boolean
}

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
  date_established?: string;
  industry: string;
  total_events: number;
}

// Existing Types
export interface Emails {
  id: number /* primary key */;
  sender: string;
  receiver: string;
  subject?: string;
  body?: string;
  status?: string;
  date_created?: string;
}

export interface Organizations {
  id?: string;
  selected: boolean;
  organizationid: string /* primary key */;
  name: string;
  description?: string | null;
  adminid?: string /* foreign key to combined_user_data.id */;
  created_at?: string;
  organization_type?: string;
  industry?: string;
  organization_size?: string | number;
  website?: string;
  date_established?: string;
  address?: Address;
  socials?: Socials;
  slug: string;
  photo?: string | null;
  banner?: string | null;
  combined_user_data?: Combined_user_data;
}

export interface Organization_roles {
  role_id: string /* primary key */;
  org_id: string /* foreign key to organizations.organizationid */;
  role: string;
  color?: string;
  deletable: boolean;
  editable?: boolean;
  organizations?: Organizations;
}

export interface Memberships {
  membershipid: string /* primary key */;
  organizationid?: string /* foreign key to organizations.organizationid */;
  name: string;
  description?: string;
  registrationfee: any; // type unknown;
  features?: any; // type unknown;
  mostPopular?: boolean;
  yearlydiscount?: any; // type unknown;
  organizations?: Organizations;
}

export interface Permissions {
  perm_id: string /* primary key */;
  category?: string;
  name: string;
  description?: string;
}

export interface Role_permissions {
  role_id: string /* primary key */ /* foreign key to organization_roles.role_id */;
  perm_id: string /* primary key */ /* foreign key to permissions.perm_id */;
  organization_roles?: Organization_roles;
  permissions?: Permissions;
}

export interface Payments {
  paymentid: string /* primary key */;
  payerid?: string /* foreign key to combined_user_data.id */;
  eventregistrationid?: string /* foreign key to eventregistrations.eventregistrationid */;
  amount: any; // type unknown;
  paymentdate?: string;
  paymentmethod?: string;
  combined_user_data?: Combined_user_data;
  eventregistrations?: Eventregistrations;
}

export interface Notifications {
  notificationid: string /* primary key */;
  organizationmemberid?: string /* foreign key to organizationmembers.organizationmemberid */;
  eventid?: string /* foreign key to events.eventid */;
  title?: string;
  eventdatetime?: string;
  orgname?: string;
  isread?: boolean;
  userid?: string;
  message?: string;
  created_on?: string;
  type?: string;
  path?: string;
  organizationmembers?: Organizationmembers;
  events?: Events;
}

export interface Posts {
  postid: string /* primary key */;
  organizationid: string /* foreign key to organizations.organizationid */;
  authorid: string /* foreign key to combined_user_data.id */;
  content?: string;
  privacylevel?: any; // type unknown;
  targetmembershipid?: string /* foreign key to memberships.membershipid */;
  createdat?: string;
  postphoto?: string;
  organizations?: Organizations;
  combined_user_data?: Combined_user_data;
  memberships?: Memberships;
}

export interface Post_comments {
  commentid: string /* primary key */;
  created_at: string;
  postid: string /* foreign key to posts.postid */;
  authorid?: string /* foreign key to combined_user_data.id */;
  comment?: string;
  posts?: Posts;
  combined_user_data?: Combined_user_data;
}

export interface Events {
  eventid: string /* primary key */;
  organizationid: string /* foreign key to organizations.organizationid */;
  title: string;
  description?: string;
  eventdatetime: string;
  location?: string;
  registrationfee?: any; // type unknown;
  createdat?: string;
  capacity?: number;
  adminid?: string /* foreign key to combined_user_data.id */;
  privacy?: any; // type unknown;
  eventphoto?: string;
  tags?: any; // type unknown;
  eventslug: string;
  organizations?: Organizations;
  combined_user_data?: Combined_user_data;
}

export interface Eventregistrations {
  eventregistrationid: string /* primary key */;
  eventid?: string /* foreign key to events.eventid */;
  organizationmemberid?: string /* foreign key to organizationmembers.organizationmemberid */;
  registrationdate?: string;
  status?: any; // type unknown;
  userid?: string /* foreign key to combined_user_data.id */;
  events?: Events;
  organizationmembers?: Organizationmembers;
  combined_user_data?: Combined_user_data;
}

export interface Combined_user_data {
  id?: string /* primary key */;
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  website?: string;
  updatedat?: string;
}

export interface Userprofiles {
  userid: string /* foreign key to combined_user_data.id */;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  profilepicture?: string;
  website?: string;
  updatedat?: string;
  id: number /* primary key */;
  combined_user_data?: Combined_user_data;
}

export interface User_membership_info {
  userid?: string /* foreign key to combined_user_data.id */;
  first_name?: string;
  last_name?: string;
  gender?: string;
  dateofbirth?: string;
  description?: string;
  company?: string;
  profilepicture?: string;
  website?: string;
  updatedat?: string;
  organizationmemberid?: string /* primary key */;
  organizationid?: string /* foreign key to organizations.organizationid */;
  roleid?: string /* foreign key to organization_roles.role_id */;
  joindate?: string;
  enddate?: string;
  organization_slug?: string;
  role_name?: string;
  role_color?: string;
  role_deletable?: boolean;
  role_editable?: boolean;
  membership_name?: string;
  membership_description?: string;
  membership_fee?: any; // type unknown;
  membership_features?: any; // type unknown;
  combined_user_data?: Combined_user_data;
  organizations?: Organizations;
  organization_roles?: Organization_roles;
}

export interface Organizationmembers {
  organizationmemberid: string /* primary key */;
  organizationid?: string /* foreign key to organizations.organizationid */;
  userid?: string /* foreign key to combined_user_data.id */;
  membershipid?: string /* foreign key to memberships.membershipid */;
  roleid?: string /* foreign key to organization_roles.role_id */;
  joindate?: string;
  enddate?: string;
  months?: number;
  organizations?: Organizations;
  combined_user_data?: Combined_user_data;
  memberships?: Memberships;
  organization_roles?: Organization_roles;
}

export interface AnalyticsDashboardProps {
  organizationId: string;
}

export interface AnalyticsData {
  day_joined: string;
  members_joined: number;
  total_members: number;
  total_posts: number;
  total_events: number;
  event_title: string;
  total_registrations: number;
  postid: string;
  total_comments: number;
  eventid: string;
  day_registered: string;
  registrations_count: number;
}

export interface TotalStats {
  total_orgs: number;
  total_events: number;
  total_members: number;
}

export interface TopOrg {
  name: string;
  total_events: number;
  total_posts: number;
  total_members: number;
}

export interface Registration {
  registration_date: string;
  total_registrations: number;
}
