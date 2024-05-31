import { Eventregistrations } from "./events";
import { Combined_user_data } from "./users";

export interface Payments {
  paymentid: string;
  payerid?: string;
  eventregistrationid?: string;
  amount: any;
  paymentdate?: string;
  paymentmethod?: string;
  combined_user_data?: Combined_user_data;
  eventregistrations?: Eventregistrations;
}
