// app/api/fetch-newsletter-emails/route.ts

import { NextResponse } from 'next/server';
import imaps from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';
import { Email, IncomingAttachment } from '@/types/email';
import logger from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';

const imapConfig = {
  imap: {
    user: process.env.NEXT_PUBLIC_GMAIL_USER!, // Your Gmail email address
    password: process.env.NEXT_PUBLIC_GMAIL_APP_PASSWORD!, // Your Gmail App Password
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 3000,
  },
};

export async function GET() {
  try {
    logger.info("Connecting to IMAP...");

    const connection = await imaps.connect(imapConfig);
    logger.info("Connected to IMAP successfully!");

    const mailboxes = ['INBOX', '[Gmail]/Sent Mail'];

    const allEmails: Email[] = [];

    // Define the directory where attachments will be saved
    const attachmentsDir = path.join(process.cwd(), 'attachments');

    // Ensure the attachments directory exists
    await fs.mkdir(attachmentsDir, { recursive: true });
    logger.info(`Attachments directory ensured at: ${attachmentsDir}`);

    for (const mailbox of mailboxes) {
      await connection.openBox(mailbox);
      logger.info(`Opened ${mailbox} successfully!`);

      const searchCriteria = ['ALL'];
      const fetchOptions = {
        bodies: [''],
        struct: true,
        markSeen: false,
      };

      const results = await connection.search(searchCriteria, fetchOptions);
      logger.info(`Emails fetched successfully from ${mailbox}!`);

      for (const res of results) {
        const rawEmailPart = res.parts.find((part: any) => part.which === '');
        const rawEmail = rawEmailPart ? rawEmailPart.body : null;

        if (rawEmail) {
          // Parse the raw email content
          const parsedEmail: ParsedMail = await simpleParser(rawEmail);

          // Extract attachments if any and save them
          const attachments: IncomingAttachment[] = [];

          for (const [index, attachment] of parsedEmail.attachments.entries()) {
            const originalFilename = attachment.filename || `attachment-${index}`;
            const uniqueFilename = `${res.attributes.uid}-${Date.now()}-${originalFilename}`;
            const sanitizedFilename = path.basename(uniqueFilename); // Prevent directory traversal

            const filePath = path.join(attachmentsDir, sanitizedFilename);

            try {
              await fs.writeFile(filePath, attachment.content);
              logger.info(`Saved attachment: ${sanitizedFilename}`);

              attachments.push({
                filename: sanitizedFilename,
                contentType: attachment.contentType || 'application/octet-stream',
                url: `/api/get-attachment?filename=${encodeURIComponent(sanitizedFilename)}`,
              });
            } catch (writeError: any) {
              logger.error(`Failed to save attachment ${sanitizedFilename}: ${writeError.message}`);
              // Optionally, continue without failing the entire email processing
            }
          }

          // Construct the Email object
          const email: Email = {
            id: res.attributes.uid.toString(),
            from: formatAddress(parsedEmail.from),
            to: parsedEmail.to
              ? Array.isArray(parsedEmail.to)
                ? parsedEmail.to.map((addr: any) => `${addr.name} <${addr.address}>`)
                : parsedEmail.to.value.map((addr: any) => `${addr.name} <${addr.address}>`)
              : [],
            subject: parsedEmail.subject || 'No Subject',
            date: parsedEmail.date ? parsedEmail.date.toISOString() : 'No Date',
            body: parsedEmail.text || '',
            htmlContent: parsedEmail.html || '',
            attachments: attachments.length > 0 ? attachments : [],
            mailbox,
            status: 'unread',
            date_created: new Date().toISOString(),
          };

          logger.info(`Email fetched from ${mailbox}: %o`, email);

          allEmails.push(email);
        }
      }
    }

    connection.end();
    logger.info("IMAP connection closed.");

    return NextResponse.json({ emails: allEmails });

  } catch (error: any) {
    logger.error("Error fetching emails: %o", error);
    return NextResponse.json(
      { message: 'Error fetching emails', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Formats an address object to a string.
 * @param address The address object from mailparser.
 * @returns A formatted address string.
 */
function formatAddress(address: any): string {
  if (!address || !address.value) return 'Unknown';
  return address.value.map((addr: any) => `${addr.name} <${addr.address}>`).join(', ');
}
