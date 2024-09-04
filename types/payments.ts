import { CombinedUserData } from '@/types/combined_user_data';
import { EventRegistrations } from '@/types/event_registrations';

export interface Payments {
  paymentid: string;
  payerid?: string;
  eventregistrationid?: string;
  amount: any;
  paymentdate?: string;
  paymentmethod?: string;
  combined_user_data?: CombinedUserData;
  eventregistrations?: EventRegistrations;
}
