// pages/api/certificates/preview.ts

import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/client";
import PDFDocument from "pdfkit";

// -------------------- Type Definitions --------------------
interface EventCertificateSettings {
  certificate_background: string;
}

interface EventData {
  title: string;
  starteventdatetime: string; // ISO string
  event_certificate_settings: EventCertificateSettings;
}

interface Signatory {
  id: number;
  event_id: string;
  name: string;
  signature: string | null;
  position: string;
  created_at: string;
}

// -------------------- Constants --------------------
const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

// -------------------- Helper Function --------------------
interface FitTextOptions {
  align?: "center" | "justify" | "left" | "right";
  underline?: boolean;
  width?: number;
}

function fitTextAt(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  options: FitTextOptions = {},
  maxWidth: number,
  initialFontSize: number
): void {
  let fontSize = initialFontSize;
  doc.fontSize(fontSize);
  while (doc.widthOfString(text) > maxWidth && fontSize > 8) {
    fontSize -= 1;
    doc.fontSize(fontSize);
  }
  doc.text(text, x, y, options);
}

// -------------------- API Route Handler --------------------
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { event_id } = req.query;

  // -------------------- Input Validation --------------------
  if (!event_id || typeof event_id !== "string") {
    res.status(400).json({ error: "Invalid or missing event_id" });
    return;
  }

  const supabase = createClient();

  // -------------------- Fetch Event Details --------------------
  const { data, error: eventError } = await supabase
    .from("events")
    .select(`
      title,
      starteventdatetime,
      event_certificate_settings (
        certificate_background
      )
    `)
    .eq("eventid", event_id)
    .single();

  if (eventError || !data) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  // Cast the fetched data to EventData
  const event: EventData = data as unknown as EventData;

  // -------------------- Fetch Signatories --------------------
  const { data: signatoriesData, error: signatoriesError } = await supabase
    .from("event_signatories")
    .select("*")
    .eq("event_id", event_id)
    .limit(3); // Limit to 3 signatories

  if (signatoriesError) {
    console.error("Error fetching signatories:", signatoriesError);
    res.status(500).json({ error: "Error fetching signatories" });
    return;
  }

  // Cast the fetched signatories to Signatory[]
  const signatories: Signatory[] = signatoriesData as Signatory[];

  const participantName = "John Doe"; // Replace with actual user data if available

  // -------------------- Initialize PDF Document --------------------
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=certificate_preview_${event_id}.pdf`
  );

  doc.pipe(res);

  // -------------------- Add Background Image --------------------
  const eventCertificateSettings = event.event_certificate_settings;
  const backgroundImageUrl = eventCertificateSettings?.certificate_background
    ? `${SUPABASE_STORAGE_URL}${eventCertificateSettings.certificate_background}`
    : null;

  console.log("backgroundImageUrl:", backgroundImageUrl);

  if (backgroundImageUrl) {
    try {
      const response = await fetch(backgroundImageUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        doc.image(buffer, 0, 0, {
          width: doc.page.width,
          height: doc.page.height,
        });
      } else {
        console.warn(`Failed to fetch background image: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error fetching background image:", err);
    }
  }

  // -------------------- Set Fonts --------------------
  const titleFont = "Times-Bold";
  const regularFont = "Times-Roman";

  // -------------------- Define Layout Constants --------------------
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth * 0.6; // Use 60% of the page width
  const contentStartX = (pageWidth - contentWidth) / 2; // Center the content horizontally
  const contentStartY = pageHeight * 0.25; // Start at 25% down the page

  // -------------------- Add Certificate Title --------------------
  doc.font(titleFont);
  fitTextAt(
    doc,
    "Certificate of Participation",
    contentStartX,
    contentStartY,
    { align: "center", width: contentWidth },
    contentWidth,
    30 // Reduced font size
  );

  // -------------------- Add Decorative Line Below Title --------------------
  doc
    .moveTo(contentStartX + 20, contentStartY + 40)
    .lineTo(contentStartX + contentWidth - 20, contentStartY + 40)
    .strokeColor("#000")
    .lineWidth(1)
    .stroke();

  // -------------------- Add Body Text --------------------
  doc.font(regularFont);
  const messageY = contentStartY + 50;
  const message = `This certificate is proudly presented to`;
  fitTextAt(
    doc,
    message,
    contentStartX,
    messageY,
    { align: "center", width: contentWidth },
    contentWidth,
    14 // Reduced font size
  );

  // -------------------- Add Participant's Name --------------------
  const nameY = messageY + 30;
  doc.font(titleFont);
  fitTextAt(
    doc,
    participantName,
    contentStartX,
    nameY,
    { align: "center", width: contentWidth },
    contentWidth,
    26 // Reduced font size
  );

  // -------------------- Add Appreciation Text --------------------
  doc.font(regularFont);
  const appreciationY = nameY + 40;
  const appreciationText = `In recognition of your participation during the event`;
  fitTextAt(
    doc,
    appreciationText,
    contentStartX,
    appreciationY,
    { align: "center", width: contentWidth },
    contentWidth,
    12 // Reduced font size
  );

  // -------------------- Add Event Title --------------------
  const eventTitleY = appreciationY + 30;
  doc.font(titleFont);
  fitTextAt(
    doc,
    event.title,
    contentStartX,
    eventTitleY,
    { align: "center", width: contentWidth },
    contentWidth,
    18 // Reduced font size
  );

  // -------------------- Add Event Date --------------------
  doc.font(regularFont);
  const eventDateY = eventTitleY + 30;
  const eventDateText = `Held on ${new Date(event.starteventdatetime).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  )}`;
  fitTextAt(
    doc,
    eventDateText,
    contentStartX,
    eventDateY,
    { align: "center", width: contentWidth },
    contentWidth,
    12 // Reduced font size
  );

  // -------------------- Add Closing Text --------------------
  const closingY = eventDateY + 30;
  const closingText = `We appreciate your dedication and the time you've invested.`;
  fitTextAt(
    doc,
    closingText,
    contentStartX,
    closingY,
    { align: "center", width: contentWidth },
    contentWidth,
    12 // Reduced font size
  );

  // -------------------- Fetch Signatory Images --------------------
  const signaturePromises = signatories.map(async (signatory) => {
    if (signatory.signature) {
      const signatureUrl = signatory.signature.startsWith("http")
        ? signatory.signature
        : `${SUPABASE_STORAGE_URL}${signatory.signature}`;

      try {
        const response = await fetch(signatureUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch signature image for ${signatory.name}: ${response.statusText}`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return { signatory, buffer };
      } catch (err) {
        console.error(`Error fetching signature image for ${signatory.name}:`, err);
        return { signatory, buffer: null };
      }
    } else {
      return { signatory, buffer: null };
    }
  });

  const fetchedSignatures = await Promise.all(signaturePromises);

  // -------------------- Add Signatories to PDF --------------------
  if (fetchedSignatures && fetchedSignatures.length > 0) {
    const signatoryYPosition = pageHeight * 0.7; // Move closer to center
    const totalSignatories = fetchedSignatures.length;
    const spacing = pageWidth / (totalSignatories + 1);

    fetchedSignatures.forEach(({ signatory, buffer }, index) => {
      const xPosition = spacing * (index + 1);
      const signatureWidth = 80; // Reduced size
      const signatureHeight = 40; // Reduced size

      // Add Signature Image or Placeholder
      const signatureImageYPosition = signatoryYPosition + 10; // Adjust as needed
      if (buffer) {
        doc.image(buffer, xPosition - signatureWidth / 2, signatureImageYPosition, {
          width: signatureWidth,
          height: signatureHeight,
        });
      } else {
        fitTextAt(
          doc,
          "Signature not available",
          xPosition - signatureWidth / 2,
          signatureImageYPosition,
          { align: "center", width: signatureWidth },
          signatureWidth,
          12
        );
      }

      const nameYPosition = signatureImageYPosition + signatureHeight + 5; // Adjust as needed

      // Add Signatory Name
      doc.font(titleFont);
      fitTextAt(
        doc,
        signatory.name,
        xPosition - 75,
        nameYPosition,
        { align: "center", width: 150 },
        150,
        10 // Reduced font size
      );

      // Add Underline Below Name
      const underlineY = nameYPosition + 12;
      doc
        .moveTo(xPosition - 50, underlineY)
        .lineTo(xPosition + 50, underlineY)
        .strokeColor("#000")
        .lineWidth(1)
        .stroke();

      // Add Signatory Position
      fitTextAt(
        doc,
        signatory.position,
        xPosition - 75,
        underlineY + 5,
        { align: "center", width: 150 },
        150,
        8 // Reduced font size
      );
    });
  }

  // -------------------- Finalize PDF --------------------
  doc.end();
};
