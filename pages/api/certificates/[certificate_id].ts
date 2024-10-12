import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/client";
import PDFDocument from "pdfkit";
// If using Node.js version < 18, uncomment the following line
// import fetch from 'node-fetch';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { certificate_id } = req.query;

  const supabase = createClient();

  // Fetch certificate details along with related event and user profile
  const { data: certificate, error } = await supabase
    .from("certificates")
    .select(
      `
      *,
      events(
        title,
        starteventdatetime
      ),
      userprofiles(
        first_name,
        last_name
      )
    `
    )
    .eq("certificate_id", certificate_id)
    .single();

  if (error || !certificate) {
    res.status(404).json({ error: "Certificate not found" });
    return;
  }

  // Fetch signatories for the associated event
  const { data: signatories, error: signatoriesError } = await supabase
    .from("event_signatories")
    .select("*")
    .eq("event_id", certificate.eventid);

  if (signatoriesError) {
    console.error("Error fetching signatories:", signatoriesError);
    res.status(500).json({ error: "Error fetching signatories" });
    return;
  }

  const doc = new PDFDocument({ size: "A4", layout: "landscape" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=certificate.pdf");

  doc.pipe(res);

  // Optionally, embed a certificate template image
  // doc.image("path/to/certificate/template.png", 0, 0, { width: doc.page.width });

  // Add certificate content
  doc.fontSize(25).text("Certificate of Participation", { align: "center" });
  doc.moveDown();
  doc.fontSize(18).text(`This certifies that`, { align: "center" });
  doc.moveDown();
  doc
    .fontSize(20)
    .text(
      `${certificate.userprofiles.first_name} ${certificate.userprofiles.last_name}`,
      { align: "center", underline: true }
    );
  doc.moveDown();
  doc.fontSize(18).text(`participated in`, { align: "center" });
  doc.moveDown();
  doc
    .fontSize(20)
    .text(`${certificate.events.title}`, { align: "center", underline: true });
  doc.moveDown();
  doc
    .fontSize(16)
    .text(`on ${new Date(certificate.events.starteventdatetime).toDateString()}`, {
      align: "center",
    });

  if (signatories && signatories.length > 0) {
    const signatoryYPosition = doc.page.height - 150; // Adjust Y position as needed

    // Use a for-loop to handle asynchronous operations properly
    for (let i = 0; i < signatories.length; i++) {
      const signatory = signatories[i];
      const xPosition = (doc.page.width / (signatories.length + 1)) * (i + 1);

      console.log(`Processing signatory: ${signatory.name}, Signature: ${signatory.signature}`);

      if (signatory.signature) {
        // Ensure signature path does not include 'signatures/' twice
        const relativeSignaturePath = signatory.signature.startsWith("signatures/")
          ? signatory.signature
          : `signatures/${signatory.signature}`;

        // Construct the full URL to the signature image
        const signatureUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${relativeSignaturePath}`;

        try {
          // Fetch the image data from the URL
          const response = await fetch(signatureUrl);

          if (!response.ok) {
            throw new Error(`Failed to fetch signature image for ${signatory.name}: ${response.statusText}`);
          }

          // Convert the response to a buffer
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Embed the image into the PDF
          doc.image(buffer, xPosition - 50, signatoryYPosition, { width: 100 });
        } catch (err) {
          console.error(`Error fetching signature image for ${signatory.name}:`, err);
          // Optionally, add a placeholder or skip the signature image
          doc
            .fontSize(12)
            .text("Signature not available", xPosition - 50, signatoryYPosition, {
              width: 100,
              align: "center",
            });
        }
      } else {
        // If no signature is available, you can add a placeholder or leave it blank
        doc
          .fontSize(12)
          .text("No Signature Provided", xPosition - 50, signatoryYPosition, {
            width: 100,
            align: "center",
          });
      }

      // Add signatory name below the signature
      doc.fontSize(12).text(signatory.name, xPosition - 50, signatoryYPosition + 60, {
        width: 100,
        align: "center",
      });
    }
  }

  doc.end();
};
