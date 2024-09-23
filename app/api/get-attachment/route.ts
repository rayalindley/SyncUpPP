// app/api/get-attachment/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Ensure that the route uses the Node.js runtime
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ message: 'Filename is required' }, { status: 400 });
    }

    // Sanitize the filename to prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);

    // Define the directory where attachments are stored
    const attachmentsDir = path.join(process.cwd(), 'attachments'); // Ensure this directory exists and is secure

    const filePath = path.join(attachmentsDir, sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    // Asynchronously read the file as a buffer
    const fileBuffer = await fs.promises.readFile(filePath);

    const ext = path.extname(sanitizedFilename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      // Add more MIME types as needed
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { message: 'Error fetching attachment', error: error.message },
      { status: 500 }
    );
  }
}
