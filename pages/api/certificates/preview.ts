import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/client";
import PDFDocument from "pdfkit";
// If using Node.js version < 18, uncomment the following line
// import fetch from 'node-fetch';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { event_id } = req.query;

  if (!event_id) {
    res.status(400).json({ error: "event_id is required" });
    return;
  }

  const supabase = createClient();

  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("title, starteventdatetime")
    .eq("eventid", event_id)
    .single();

  if (eventError || !event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  // Fetch signatories
  const { data: signatories, error: signatoriesError } = await supabase
    .from("event_signatories")
    .select("*")
    .eq("event_id", event_id);

  if (signatoriesError) {
    console.error("Error fetching signatories:", signatoriesError);
    res.status(500).json({ error: "Error fetching signatories" });
    return;
  }

  console.log("Signatories fetched:", signatories);

  const sampleUserName = "John Doe"; // Replace with actual user data if available

  const doc = new PDFDocument({ size: "A4", layout: "landscape" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=certificate_preview.pdf");

  doc.pipe(res);

  // Add certificate content
  doc.fontSize(25).text("Certificate of Participation", { align: "center" });
  doc.moveDown();
  doc.fontSize(18).text(`This certifies that`, { align: "center" });
  doc.moveDown();
  doc.fontSize(20).text(`${sampleUserName}`, { align: "center", underline: true });
  doc.moveDown();
  doc.fontSize(18).text(`participated in`, { align: "center" });
  doc.moveDown();
  doc.fontSize(20).text(`${event.title}`, { align: "center", underline: true });
  doc.moveDown();
  doc
    .fontSize(16)
    .text(`on ${new Date(event.starteventdatetime).toDateString()}`, { align: "center" });

  if (signatories && signatories.length > 0) {
    const signatoryYPosition = doc.page.height - 150; // Adjust Y position as needed

    for (let i = 0; i < signatories.length; i++) {
      const signatory = signatories[i];
      const xPosition = (doc.page.width / (signatories.length + 1)) * (i + 1);

      console.log(`Processing signatory: ${signatory.name}, Signature: ${signatory.signature}`);

      if (signatory.signature) {
        const signatureUrl = signatory.signature.startsWith("http")
          ? signatory.signature
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${signatory.signature}`;

        console.log(`Fetching signature from URL: ${signatureUrl}`);

        try {
          const response = await fetch(signatureUrl);

          if (!response.ok) {
            throw new Error(`Failed to fetch signature image for ${signatory.name}: ${response.statusText}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          doc.image(buffer, xPosition - 50, signatoryYPosition, { width: 100 });
        } catch (err) {
          console.error(`Error fetching signature image for ${signatory.name}:`, err);
          doc
            .fontSize(12)
            .text("Signature not available", xPosition - 50, signatoryYPosition, {
              width: 100,
              align: "center",
            });
        }
      } else {
        doc
          .fontSize(12)
          .text("No Signature Provided", xPosition - 50, signatoryYPosition, {
            width: 100,
            align: "center",
          });
      }

      doc.fontSize(12).text(signatory.name, xPosition - 50, signatoryYPosition + 60, {
        width: 100,
        align: "center",
      });
    }
  }

  doc.end();
};
