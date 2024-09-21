// pages/api/send-newsletter-email.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs/promises';
import { OutgoingAttachment, EmailResult } from '@/types/email';
import { sendNewsletterEmail } from '@/lib/send_newsletter_email';

// Disable Next.js default body parsing to handle multipart/form-data with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Helper function to safely extract a single string from formidable fields.
 * If the field is an array, it returns the first element.
 * If the field is undefined, it returns a default value.
 *
 * @param field - The field value from formidable (string | string[] | undefined)
 * @param defaultValue - Optional default value to return if the field is undefined
 * @returns A single string value
 */
const getString = (
  field: string | string[] | undefined,
  defaultValue: string = ''
): string => {
  if (Array.isArray(field)) return field[0];
  return field || defaultValue;
};

/**
 * Validates an array of email addresses.
 *
 * @param emails - Array of email addresses to validate.
 * @returns Array of valid email addresses.
 */
const validateEmails = (emails: string[]): string[] => {
  const validEmails = emails.filter((email) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      console.warn(`Invalid email address skipped: ${email}`);
    }
    return isValid;
  });
  return validEmails;
};

/**
 * API Route Handler
 *
 * Handles POST requests to send newsletter emails with optional attachments.
 *
 * @param req - NextApiRequest object
 * @param res - NextApiResponse object
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Received request:', {
    method: req.method,
    headers: req.headers,
    url: req.url,
  });

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.warn(`Method ${req.method} not allowed.`);
      res.setHeader('Allow', ['POST']);
      return res
        .status(405)
        .json({ error: `Method '${req.method}' Not Allowed` });
    }

    // Initialize formidable with desired options
    const form = new IncomingForm({
      multiples: true,
      maxFileSize: 25 * 1024 * 1024, // 25MB per file
      allowEmptyFiles: false,
    });

    console.log('Initialized formidable with options:', form);

    // Parse the incoming form data
    const { fields, files } = await new Promise<{
      fields: Fields;
      files: Files;
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Formidable parse error:', err);
          reject(err);
        } else {
          console.log('Formidable parsed fields:', fields);
          console.log('Formidable parsed files:', files);
          resolve({ fields, files });
        }
      });
    });

    // Safely extract each field as a string
    const fromName = getString(fields.fromName, 'Default Name');
    const replyToExtension = getString(fields.replyToExtension);
    const recipientsString = getString(fields.recipients);
    let recipients: string[] = [];

    if (recipientsString) {
      try {
        recipients = JSON.parse(recipientsString);
        if (!Array.isArray(recipients)) {
          throw new Error('Recipients should be an array.');
        }
        console.log('Parsed recipients:', recipients);
      } catch (error: any) {
        console.error('Invalid recipients format:', error.message);
        return res.status(400).json({
          message: 'Invalid recipients format.',
          error: error.message,
        });
      }
    }

    // Validate email addresses
    const validRecipients = validateEmails(recipients);
    console.log('Valid recipients after validation:', validRecipients);

    if (validRecipients.length === 0) {
      console.warn('No valid recipients provided.');
      return res
        .status(400)
        .json({ message: 'No valid recipients provided.' });
    }

    const subject = getString(fields.subject, 'Default Subject');
    const message = getString(fields.message, '');

    console.log('Email subject:', subject);
    console.log('Email message:', message);

    // Handle attachments
    let attachments: OutgoingAttachment[] = [];
    if (files.attachments) {
      const attachmentsArray = Array.isArray(files.attachments)
        ? files.attachments
        : [files.attachments];
      console.log('Processing attachments:', attachmentsArray);

      // Calculate total size
      const totalSize = attachmentsArray.reduce(
        (acc, file) => acc + (file.size || 0),
        0
      );
      const maxTotalSize = 25 * 1024 * 1024; // 25MB

      if (totalSize > maxTotalSize) {
        console.warn(
          `Total attachment size ${totalSize} exceeds the limit of ${maxTotalSize} bytes.`
        );
        return res.status(400).json({
          message: 'Total attachment size exceeds the 25MB limit.',
        });
      }

      attachments = await Promise.all(
        attachmentsArray.map(async (file: formidable.File) => {
          console.log(`Reading file: ${file.filepath}`);
          const content = await fs.readFile(file.filepath);
          console.log(`File read successfully: ${file.filepath}`);

          // Optionally delete the temporary file
          try {
            await fs.unlink(file.filepath);
            console.log(`Temporary file deleted: ${file.filepath}`);
          } catch (err: any) {
            console.warn(
              `Failed to delete temporary file ${file.filepath}:`,
              err.message
            );
          }

          return {
            filename: file.originalFilename || 'attachment',
            content,
            contentType: file.mimetype || 'application/octet-stream',
          } as OutgoingAttachment;
        })
      );

      console.log('Processed attachments:', attachments);
    } else {
      console.log('No attachments provided.');
    }

    // Send the newsletter email
    console.log('Sending newsletter email...');
    const result: EmailResult = await sendNewsletterEmail({
      fromName,
      replyToExtension,
      recipients: validRecipients,
      subject,
      message,
      attachments,
    });

    console.log('Email sending result:', result);

    if (result.success) {
      console.log('Email sent successfully.');
      return res.status(200).json({ message: 'Email sent successfully' });
    } else {
      console.error('Error sending email:', result.error);
      return res.status(500).json({
        message: 'Error sending email',
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in send-newsletter-email route:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred',
      error: error.message,
    });
  }
}
