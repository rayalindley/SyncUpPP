import { Eventregistrations } from "./events";
import { Combined_user_data } from "./users";

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
