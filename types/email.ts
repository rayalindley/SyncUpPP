
export interface Email {
  [key: string]: any;
  id: number;
  sender: string;
  receiver: string;
  subject: string;
  body: string;
  status: string;
  date_created: Date;
  sender_id?: string;
  receiver_id?: string;
}
