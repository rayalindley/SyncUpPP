// File: pages/api/certificates/[certificate_id].ts

import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/client"; // Ensure createClient exports the Supabase client instance
import PDFDocument from "pdfkit";

// -------------------- Type Definitions --------------------

interface Signatory {
  id: number;
  event_id: string;
  name: string;
  signature: string | null;
  position: string;
  created_at: string;
}

interface FetchedSignature {
  signatory: Signatory;
  buffer: Buffer | null;
}

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
  while (doc.widthOfString(text, options) > maxWidth && fontSize > 8) {
    fontSize -= 1;
    doc.fontSize(fontSize);
  }
  doc.text(text, x, y, options);
}

// -------------------- API Route Handler --------------------
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { certificate_id } = req.query;

  // -------------------- Input Validation --------------------
  if (!certificate_id || typeof certificate_id !== "string") {
    res.status(400).json({ error: "Invalid or missing certificate_id" });
    return;
  }

  // -------------------- Initialize Supabase Client --------------------
  const supabase = createClient();

  // -------------------- Fetch Certificate Details --------------------
  const { data: certificate, error: certError } = await supabase
    .from("certificates")
    .select("*")
    .eq("certificate_id", certificate_id)
    .single();

  if (certError || !certificate) {
    res.status(404).json({ error: "Certificate not found" });
    return;
  }

  // -------------------- Fetch Event Details --------------------
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("title, starteventdatetime")
    .eq("eventid", certificate.event_id)
    .single();

  if (eventError || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  // -------------------- Fetch Event Certificate Settings --------------------
  const { data: eventCertSettings, error: eventCertError } = await supabase
    .from("event_certificate_settings")
    .select("certificate_background")
    .eq("event_id", certificate.event_id)
    .single();

  if (eventCertError) {
    console.error("Error fetching event certificate settings:", eventCertError);
    // Proceeding without background image if error occurs
  }

  // -------------------- Fetch User Profile --------------------
  const { data: userProfile, error: userProfileError } = await supabase
    .from("userprofiles")
    .select("first_name, last_name")
    .eq("userid", certificate.user_id)
    .single();

  if (userProfileError || !userProfile) {
    res.status(404).json({ error: "User profile not found" });
    return;
  }

  // -------------------- Fetch Signatories --------------------
  const { data: signatories, error: signatoriesError } = await supabase
    .from("event_signatories")
    .select("*")
    .eq("event_id", certificate.event_id)
    .limit(3);

  if (signatoriesError) {
    console.error("Error fetching signatories:", signatoriesError);
    res.status(500).json({ error: "Error fetching signatories" });
    return;
  }

  // -------------------- Fetch Signatory Images --------------------
  const signaturePromises: Promise<FetchedSignature>[] = signatories.map(async (signatory): Promise<FetchedSignature> => {
    if (signatory.signature) {
      const signatureUrl = signatory.signature.startsWith("http")
        ? signatory.signature
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${signatory.signature}`;

      try {
        const response = await fetch(signatureUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch signature image for ${signatory.name}: ${response.statusText}`);
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

  const fetchedSignatures: FetchedSignature[] = await Promise.all(signaturePromises);

  // -------------------- Initialize PDF Document --------------------
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=certificate_${certificate_id}.pdf`
  );

  doc.pipe(res);

  // -------------------- Add Background Image --------------------
  const backgroundImageUrl = eventCertSettings?.certificate_background
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${eventCertSettings.certificate_background}`
    : null;

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
    30 // Font size
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
    14 // Font size
  );

  // -------------------- Add Participant's Name --------------------
  const participantName = `${userProfile.first_name} ${userProfile.last_name}`;
  const nameY = messageY + 30;
  doc.font(titleFont);
  fitTextAt(
    doc,
    participantName,
    contentStartX,
    nameY,
    { align: "center", width: contentWidth },
    contentWidth,
    26 // Font size
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
    12 // Font size
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
    18 // Font size
  );

  // -------------------- Add Event Date --------------------
  doc.font(regularFont);
  const eventDateY = eventTitleY + 30;
  const eventDate = new Date(event.starteventdatetime).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const eventDateText = `Held on ${eventDate}`;
  fitTextAt(
    doc,
    eventDateText,
    contentStartX,
    eventDateY,
    { align: "center", width: contentWidth },
    contentWidth,
    12 // Font size
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
    12 // Font size
  );

  // -------------------- Add Signatories to PDF --------------------
  if (fetchedSignatures.length > 0) {
    const signatoryYPosition = pageHeight * 0.7; // Position signatories closer to the bottom
    const totalSignatories = fetchedSignatures.length;
    const spacing = pageWidth / (totalSignatories + 1);

    fetchedSignatures.forEach((fetchedSignature, index) => {
      const { signatory, buffer } = fetchedSignature;
      const xPosition = spacing * (index + 1);
      const signatureWidth = 80; // Adjust as needed
      const signatureHeight = 40; // Adjust as needed

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
          12 // Font size
        );
      }

      const nameYPosition = signatureImageYPosition + signatureHeight + 5; // Position name below signature

      // Add Signatory Name
      doc.font(titleFont);
      fitTextAt(
        doc,
        signatory.name,
        xPosition - 75,
        nameYPosition,
        { align: "center", width: 150 },
        150,
        10 // Font size
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
        8 // Font size
      );
    });
  }

  // -------------------- Finalize PDF --------------------
  doc.end();
};
