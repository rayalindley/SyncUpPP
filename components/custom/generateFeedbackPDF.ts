import jsPDF from "jspdf";

interface GeneratePDFParams {
  eventName: string;
  reportsLeft: number;
  organization: { name?: string; organizationname?: string };
  totalResponses: number;
  averageLikert: string;
  sentimentCounts: { positive: number; negative: number };
  topKeywords: [string, number][];
  summary: string | null;
  recommendations: string[];
  generatedBy: string;
  model: "llama" | "felbert";
  eventFilter: string;
}

// Draw a native pie chart using jsPDF arcs
function drawPieChart(
  pdf: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  positive: number,
  negative: number
) {
  const total = positive + negative;
  if (total === 0) {
    // Empty state circle
    pdf.setFillColor(60, 60, 60);
    pdf.circle(cx, cy, radius, "F");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("No data", cx, cy + 3, { align: "center" });
    return;
  }

  const slices = [
    { value: positive, r: 52, g: 211, b: 153, a:0.8},  // emerald
    { value: negative, r: 244, g: 63,  b: 94, a:0.8 },  // rose
  ];

  let startAngle = -Math.PI / 2; // start from top

  slices.forEach(({ value, r, g, b }) => {
    const sweep = (value / total) * 2 * Math.PI;
    const endAngle = startAngle + sweep;

    // Build arc path manually
    const steps = Math.max(32, Math.round(sweep * 20));
    const points: [number, number][] = [[cx, cy]];

    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (sweep * i) / steps;
      points.push([
        cx + radius * Math.cos(angle),
        cy + radius * Math.sin(angle),
      ]);
    }

    pdf.setFillColor(r, g, b);
    pdf.lines(
      points.slice(1).map((p, i) => {
        const prev = i === 0 ? points[0] : points[i];
        return [p[0] - prev[0], p[1] - prev[1]] as [number, number];
      }),
      points[0][0],
      points[0][1],
      [1, 1],
      "F",
      true
    );

    // Percentage label
    const midAngle = startAngle + sweep / 2;
    const labelR = radius * 0.65;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const pct = Math.round((value / total) * 100);
    if (pct > 5) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${pct}%`, lx, ly + 3, { align: "center" });
    }

    // after drawing each slice, add border stroke
    pdf.setDrawColor(255, 255, 255); // white divider between slices
    pdf.setLineWidth(1);
    // draw a line from center to edge at startAngle and endAngle
    pdf.line(cx, cy, cx + radius * Math.cos(startAngle), cy + radius * Math.sin(startAngle));

    startAngle = endAngle;
  });

}

export function generateFeedbackPDF({
  eventName,
  organization,
  reportsLeft,
  totalResponses,
  averageLikert,
  sentimentCounts,
  topKeywords,
  summary,
  recommendations,
  generatedBy,
  model,
  eventFilter,
}: GeneratePDFParams) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = W - margin * 2;
  let y = 0;

  const orgName =
    organization.organizationname ?? organization.name ?? "";

  // Fill page background
  const fillPageBg = () => {
    pdf.setFillColor(28, 28, 28);
    pdf.rect(0, 0, W, H, "F");
  };

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > H - 36) {
      pdf.addPage();
      fillPageBg();
      y = margin;
    }
  };

  fillPageBg();

  // ── Header ──────────────────────────────────────────────
    pdf.setFillColor(38, 38, 38);
  pdf.roundedRect(margin, 24, contentWidth, 56, 6, 6, "F");
 
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Report Generated for ${eventName || "Event"}`, margin + 14, 46);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(160, 160, 160);
  pdf.text(
    `Organized by:  ${orgName}`,
    margin + 14,
    60
  );
  pdf.text(
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    margin + 14,
    72
  );
 
  y = 100;
  // ── Metrics row ─────────────────────────────────────────
  const metrics = [
    ["Total Responses", String(totalResponses)],
    ["Avg Likert", averageLikert],
    ["Generations Left", String(reportsLeft)],
  ];
  const boxW = contentWidth / metrics.length;

  metrics.forEach(([label, value], i) => {
    const x = margin + i * boxW;
    pdf.setFillColor(42, 42, 42);
    pdf.roundedRect(x, y, boxW - 8, 52, 4, 4, "F");

    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text(value, x + (boxW - 8) / 2, y + 28, { align: "center" });

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(140, 140, 140);
    pdf.text(label, x + (boxW - 8) / 2, y + 42, { align: "center" });
  });

  y += 68;

  // ── Top Keywords ─────────────────────────────────────────
 if (topKeywords.length > 0) {
  addPageIfNeeded(80);

  const sectionH = 56; // adjust this if you add more rows
  
  // One big bg box for the whole section
  pdf.setFillColor(42, 42, 42); // slightly lighter than page (28,28,28)
  pdf.roundedRect(margin, y, contentWidth, sectionH, 6, 6, "F");

  // Header label
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("TOP KEYWORDS", margin + 10, y + 12);

  // Pills
  let kwX = margin + 10;
  const pillY = y + 22; // fixed Y inside the box

  const kwColors: [number, number, number, number, number, number][] = [
    // [bgR, bgG, bgB, borderR, borderG, borderB]
    [139, 92, 246, 167, 139, 250],  // violet
    [56, 189, 248, 56, 189, 248],   // sky
    [52, 211, 153, 52, 211, 153],   // emerald
    [251, 146, 60, 251, 146, 60],   // amber
    [244, 63, 94, 244, 63, 94],     // rose
  ];

  topKeywords.slice(0, 5).forEach(([word, count], i) => {
    const c = kwColors[i % kwColors.length];
    const label = `${word} x${count}`;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    const textW = pdf.getTextWidth(label) + 18;

    // bg with low opacity
    pdf.setFillColor(c[0], c[1], c[2]);
    pdf.setGState(new (pdf as any).GState({ opacity: 0.2 }));
    pdf.roundedRect(kwX, pillY, textW, 16, 8, 8, "F");

    // border
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
    pdf.setDrawColor(c[3], c[4], c[5]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(kwX, pillY, textW, 16, 8, 8, "D");

    // text
    pdf.setTextColor(c[0], c[1], c[2]);
    pdf.text(label, kwX + 9, pillY + 11);
    kwX += textW + 8;
  }); 

  y += sectionH + 12;
}

// ── Sentiment Breakdown ──────────────────────────────────
const total = sentimentCounts.positive + sentimentCounts.negative;
addPageIfNeeded(180);

const chartSectionH = 170;
pdf.setFillColor(42, 42, 42);
pdf.roundedRect(margin, y, contentWidth, chartSectionH, 6, 6, "F");

// Header
pdf.setFontSize(8);
pdf.setFont("helvetica", "bold");
pdf.setTextColor(255, 255, 255);
pdf.text("SENTIMENT BREAKDOWN", margin + 10, y + 12);

// Badges
const badgeY = y + 22;

// Positive badge (emerald)
const posLabel = `+ ${sentimentCounts.positive} Positive`;
pdf.setFontSize(9);
pdf.setFont("helvetica", "bold");
const posBadgeW = pdf.getTextWidth(posLabel) + 20;
pdf.setFillColor(20, 83, 60); // emerald dark bg
pdf.setDrawColor(52, 211, 153); // emerald border
pdf.roundedRect(margin + 10, badgeY, posBadgeW, 16, 8, 8, "FD");
pdf.setTextColor(52, 211, 153);
pdf.text(posLabel, margin + 10 + posBadgeW / 2, badgeY + 11, { align: "center" });

// Negative badge (rose)
const negLabel = `- ${sentimentCounts.negative} Negative`;
const negBadgeW = pdf.getTextWidth(negLabel) + 20;
const negBadgeX = margin + 10 + posBadgeW + 8;
pdf.setFillColor(76, 20, 30); // rose dark bg
pdf.setDrawColor(244, 63, 94); // rose border
pdf.roundedRect(negBadgeX, badgeY, negBadgeW, 16, 8, 8, "FD");
pdf.setTextColor(244, 63, 94);
pdf.text(negLabel, negBadgeX + negBadgeW / 2, badgeY + 11, { align: "center" });

// Pie chart centered below badges
if (total > 0) {
  drawPieChart(
    pdf,
    margin + contentWidth / 2,
    y + 55 + 52,  // centered vertically in remaining space
    52,
    sentimentCounts.positive,
    sentimentCounts.negative
  );
} else {
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text("No sentiment data yet", margin + contentWidth / 2, y + 100, { align: "center" });
}

y += chartSectionH + 12;

  // ── Summary ──────────────────────────────────────────────
  if (summary) {
  addPageIfNeeded(60);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const summaryLines = pdf.splitTextToSize(summary, contentWidth - 20);
  const sectionH = 14 + 12 + summaryLines.length * 14 + 12; // header + padding + lines + bottom

  pdf.setFillColor(42, 42, 42);
  pdf.roundedRect(margin, y, contentWidth, sectionH, 6, 6, "F");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("SUMMARY", margin + 10, y + 10);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(210, 210, 210);
  pdf.text(summaryLines, margin + 16, y + 26);

  y += sectionH + 12;
}
  // ── Recommendations ──────────────────────────────────────
 if (recommendations && recommendations.length > 0) {
  // Pre-calculate total height of all bullets
  let totalLinesCount = 0;
  const allBulletLines: string[][] = [];
  recommendations.forEach((rec) => {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(rec, contentWidth - 26);
    allBulletLines.push(lines);
    totalLinesCount += lines.length;
  });

  const sectionH = 14 + 12 + totalLinesCount * 14 + (recommendations.length * 8) + 12;
  addPageIfNeeded(sectionH + 20);

  pdf.setFillColor(42, 42, 42);
  pdf.roundedRect(margin, y, contentWidth, sectionH, 6, 6, "F");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("RECOMMENDATIONS", margin + 10, y + 10);

  let textY = y + 26;
  allBulletLines.forEach((lines) => {
    pdf.setFillColor(52, 211, 153); // emerald green
    pdf.circle(margin + 14, textY - 3, 2, "F"); // green dot
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(210, 210, 210);
    pdf.text(lines, margin + 20, textY); // indent text past the dot
    textY += lines.length * 14 + 8;
  });

}

  // ── Footer on every page ─────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFillColor(20, 20, 20);
    pdf.rect(0, H - 32, W, 32, "F");
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `Report Exported On: ${new Date().toLocaleDateString("en-US")}   ·   Generated by: ${generatedBy}   ·   Model: ${model === "felbert" ? "FELBERT (SyncUp++)" : "Llama (Groq)"}`,
      margin,
      H - 12
    );
    pdf.text(`Page ${p} of ${totalPages}`, W - margin, H - 12, {
      align: "right",
    });
  }

  pdf.save(`feedback-report-${eventName || eventFilter}.pdf`);
}