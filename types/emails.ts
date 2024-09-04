
export interface Emails {
  id: number;
  sender: string;
  receiver: string;
  subject?: string;
  body?: string;
  status?: string;
  date_created?: string;
}
