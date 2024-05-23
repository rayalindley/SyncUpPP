export interface Emails {
  id: number /* primary key */;
  sender: string;
  receiver: string;
  subject?: string;
  body?: string;
  status?: string;
  date_created?: string;
}
