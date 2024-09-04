
export interface EmailContent {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments: any[];
}
