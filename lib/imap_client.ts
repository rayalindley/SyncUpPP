import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

type Email = {
  from: string;
  subject: string;
  date: string;
  body: string;
};

// Configuration for Gmail IMAP
const imapConfig = {
  imap: {
    user: process.env.NEXT_PUBLIC_GMAIL_USER!,           // Your Gmail email address
    password: process.env.NEXT_PUBLIC_GMAIL_APP_PASSWORD!, // Your Gmail App Password
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 3000,
  },
};

// Connect to Gmail via IMAP and fetch emails
export const fetchEmails = async (): Promise<Email[]> => {
  const connection = await imaps.connect(imapConfig);

  await connection.openBox('INBOX'); // Open the inbox

  // Search for emails in the inbox
  const searchCriteria = ['ALL']; // Fetch all emails (modify this for filters)
  const fetchOptions = {
    bodies: ['HEADER', 'TEXT'],
    markSeen: false,
  };

  const results = await connection.search(searchCriteria, fetchOptions);
  const emails: Email[] = [];

  for (const res of results) {
    const headerPart = res.parts.find((part: any) => part.which === 'HEADER');
    const textPart = res.parts.find((part: any) => part.which === 'TEXT');

    if (textPart) {
      const parsedEmail = await simpleParser(textPart.body); // Parse the email body
    
      emails.push({
        from: headerPart?.body?.from[0],
        subject: headerPart?.body?.subject[0],
        date: headerPart?.body?.date[0],
        body: parsedEmail.text || '', // Plain text body
      });
    }
  }

  connection.end(); // Close the connection

  return emails;
};
