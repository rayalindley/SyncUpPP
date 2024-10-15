export interface Membership {
  membershipid: string;
  name: string;
  description?: string | undefined;
  price?: number;
  duration?: string;
  organizationid?: string;
  registrationfee: number;
  mostPopular?: boolean;
  features?: string[];
  cycletype: 'monthly' | 'yearly';
}
