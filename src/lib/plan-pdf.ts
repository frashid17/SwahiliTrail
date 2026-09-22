import { jsPDF } from "jspdf";
import { PDF_BRAND_MARK_DATA_URL } from "@/lib/brand-pdf-mark";
import type { CarHire } from "@/lib/data/car-hires";
import type { SavedPlan } from "@/lib/saved-trips";

type PdfMeta = {
  startDate: string;
  partySize: number;
  transportLabel?: string;
  carHires?: CarHire[];
  status?: string;
};

const BRAND = {
  deep: [4, 56, 68] as [number, number, number],
  ocean: [11, 110, 122] as [number, number, number],
  aqua: [26, 166, 181] as [number, number, number],
  coral: [224, 122, 69] as [number, number, number],
  ink: [15, 42, 48] as [number, number, number],
  muted: [90, 114, 120] as [number, number, number],
  foam: [232, 247, 246] as [number, number, number],
};

function wrap(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 18) {
    doc.addPage();
    return 22;
  }
  return y;
}

export function downloadTripPdf(
  plan: SavedPlan,
  meta: PdfMeta,
  filename = "swahili-trail-trip.pdf",
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 0;

  // Cover band — brand sheet PDF header
  doc.setFillColor(...BRAND.deep);
  doc.rect(0, 0, pageW, 42, "F");
  doc.setFillColor(...BRAND.aqua);
  doc.rect(0, 42, pageW, 2, "F");

  const markX = margin;
  const markY = 7;
  const markS = 16;
  doc.addImage(PDF_BRAND_MARK_DATA_URL, "PNG", markX, markY, markS, markS);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("SWAHILI TRAIL", markX + markS + 4, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 210, 215);
  doc.text("AI Coastal Tourism Companion · Mombasa", markX + markS + 4, 21);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = wrap(doc, plan.title, contentW);
  doc.text(titleLines, margin, 34);
  y = 52;

  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    [
      `Start: ${meta.startDate}`,
      `Party: ${meta.partySize}`,
      meta.transportLabel ? `Transport: ${meta.transportLabel}` : null,
      meta.status ? `Status: ${meta.status}` : null,
    ]
      .filter(Boolean)
      .join("  ·  "),
    margin,
    y,
  );
  y += 8;

  doc.setTextColor(...BRAND.ink);
  doc.setFontSize(10);
  const summary = wrap(doc, plan.summary, contentW);
  doc.text(summary, margin, y);
  y += summary.length * 5 + 4;

  doc.setFillColor(...BRAND.foam);
  doc.roundedRect(margin, y, contentW, 12, 2, 2, "F");
  doc.setTextColor(...BRAND.ocean);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Recommended stay", margin + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.ink);
  const stay = wrap(doc, plan.recommendedStay, contentW - 6);
  doc.text(stay[0] ?? "", margin + 3, y + 10);
  y += 18;

  if (plan.budgetBreakdown) {
    y = ensureSpace(doc, y, 36);
    doc.setFillColor(...BRAND.deep);
    doc.roundedRect(margin, y, contentW, 32, 3, 3, "F");
    doc.setTextColor(...BRAND.aqua);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Damage cost estimate", margin + 4, y + 7);
    doc.setFontSize(16);
    doc.text(
      `KES ${plan.budgetBreakdown.totalKes.toLocaleString()}`,
      margin + 4,
      y + 16,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 232);
    doc.text(
      `Lodging ${plan.budgetBreakdown.lodgingKes.toLocaleString()}  ·  Activities ${plan.budgetBreakdown.activitiesKes.toLocaleString()}  ·  Food ${plan.budgetBreakdown.foodKes.toLocaleString()}  ·  Transport ${plan.budgetBreakdown.transportKes.toLocaleString()}  ·  Buffer ${plan.budgetBreakdown.contingencyKes.toLocaleString()}`,
      margin + 4,
      y + 24,
    );
    y += 38;
  }

  for (const day of plan.days) {
    y = ensureSpace(doc, y, 42);
    doc.setDrawColor(...BRAND.aqua);
    doc.setLineWidth(0.6);
    doc.line(margin, y, margin + 18, y);
    y += 5;
    doc.setTextColor(...BRAND.aqua);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`DAY ${day.day}`, margin, y);
    doc.setTextColor(...BRAND.ink);
    doc.setFontSize(12);
    doc.text(day.theme, margin + 18, y);
    y += 6;

    const blocks: [string, string][] = [
      ["Morning", day.morning],
      ["Afternoon", day.afternoon],
      ["Evening", day.evening],
      ["Food", day.foodTip],
      ["Transport", day.transportTip],
    ];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const [label, value] of blocks) {
      y = ensureSpace(doc, y, 10);
      doc.setTextColor(...BRAND.ocean);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.ink);
      const lines = wrap(doc, value, contentW - 28);
      doc.text(lines, margin + 26, y);
      y += Math.max(lines.length, 1) * 4.4 + 1.5;
    }
    if (day.estimatedDayCostKes != null) {
      doc.setTextColor(...BRAND.muted);
      doc.setFontSize(8);
      doc.text(
        `Est. day cost ~KES ${day.estimatedDayCostKes.toLocaleString()}`,
        margin,
        y,
      );
      y += 6;
    }
    y += 3;
  }

  if (meta.carHires && meta.carHires.length > 0) {
    y = ensureSpace(doc, y, 28);
    doc.setTextColor(...BRAND.ocean);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Car hire & airport pickup", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const hire of meta.carHires) {
      y = ensureSpace(doc, y, 10);
      doc.setTextColor(...BRAND.ink);
      doc.text(
        `${hire.name}  ·  ${hire.phoneDisplay}  ·  ${hire.websiteUrl}`,
        margin,
        y,
      );
      y += 5;
    }
    y += 4;
  }

  if (plan.packingTips?.length) {
    y = ensureSpace(doc, y, 20);
    doc.setTextColor(...BRAND.ocean);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Packing", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.ink);
    for (const tip of plan.packingTips) {
      y = ensureSpace(doc, y, 8);
      const lines = wrap(doc, `• ${tip}`, contentW);
      doc.text(lines, margin, y);
      y += lines.length * 4.2;
    }
    y += 3;
  }

  if (plan.localEtiquette?.length) {
    y = ensureSpace(doc, y, 20);
    doc.setTextColor(...BRAND.ocean);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Local etiquette", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.ink);
    for (const tip of plan.localEtiquette) {
      y = ensureSpace(doc, y, 8);
      const lines = wrap(doc, `• ${tip}`, contentW);
      doc.text(lines, margin, y);
      y += lines.length * 4.2;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `Swahili Trail  ·  Page ${i} of ${pages}`,
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
    doc.setDrawColor(...BRAND.coral);
    doc.setLineWidth(0.8);
    doc.line(
      pageW - margin - 20,
      doc.internal.pageSize.getHeight() - 10,
      pageW - margin,
      doc.internal.pageSize.getHeight() - 10,
    );
  }

  doc.save(filename);
}
