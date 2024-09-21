// lib/send_newsletter_email.ts

import nodemailer from 'nodemailer';
import { OutgoingAttachment, EmailResult, OutgoingEmailData } from '@/types/email';

type EmailData = OutgoingEmailData;

/**
 * Sends a newsletter email using Nodemailer.
 *
 * @param data - Email data including recipients, subject, message, and attachments.
 * @returns EmailResult indicating success or failure.
 */
export const sendNewsletterEmail = async ({
  fromName,
  replyToExtension,
  recipients,
  subject,
  message,
  attachments = [],
}: EmailData): Promise<EmailResult> => {
  try {
    console.log('Preparing to send email to recipients:', recipients);

    // Create the transporter using Nodemailer and Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NEXT_PUBLIC_GMAIL_USER!, // Gmail address from environment variable
        pass: process.env.NEXT_PUBLIC_GMAIL_APP_PASSWORD!, // Gmail App Password from environment variable
      },
    });

    console.log('Nodemailer transporter created.');

    // Verify transporter configuration
    await transporter.verify();
    console.log('Nodemailer transporter verified successfully.');

    // Prepare attachments for Nodemailer
    const mailAttachments =
      attachments.length > 0
        ? attachments.map((file) => ({
            filename: file.filename,
            content: file.content, // Buffer content for outgoing emails
            contentType: file.contentType,
          }))
        : undefined;

    if (mailAttachments) {
      console.log('Prepared mail attachments:', mailAttachments);
    } else {
      console.log('No attachments to include in the email.');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${process.env.NEXT_PUBLIC_GMAIL_USER!}>`, // Custom name for the "From" field
      replyTo: `${process.env.NEXT_PUBLIC_GMAIL_USER!.split('@')[0]}+${replyToExtension}@gmail.com`, // Custom Reply-To using +extension
      to: recipients.join(', '), // The recipients' emails as a comma-separated string
      subject: subject, // The email subject
      html: message, // The email message in HTML format
      attachments: mailAttachments, // Attachments if any
    };

    console.log('Mail options prepared:', mailOptions);

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully.');

    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};
