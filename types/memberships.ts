import { Organizations } from '@/types/organizations';
export interface Memberships {
  membershipid: string;
  organizationid?: string;
  name: string;
  description?: string;
  registrationfee: any;
  features?: any;
  mostPopular?: boolean;
  yearlydiscount?: any;
  organizations?: Organizations;
}
