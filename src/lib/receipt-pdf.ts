import { jsPDF } from "jspdf";
import { PDF_BRAND_MARK_DATA_URL } from "@/lib/brand-pdf-mark";

export type ReceiptPdfInput = {
  planLabel: string;
  planDetail?: string;
  amountFormatted: string;
  subtotalFormatted?: string | null;
  taxFormatted?: string | null;
  reference?: string | null;
  paidAt?: string | null;
  paidWith?: string | null;
  billedTo?: string | null;
  email?: string | null;
};

const BRAND = {
  deep: [4, 56, 68] as [number, number, number],
  aqua: [26, 166, 181] as [number, number, number],
  ink: [15, 42, 48] as [number, number, number],
  muted: [90, 114, 120] as [number, number, number],
};

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function downloadReceiptPdf(
  input: ReceiptPdfInput,
  filename = "swahili-trail-receipt.pdf",
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  doc.setFillColor(...BRAND.deep);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setFillColor(...BRAND.aqua);
  doc.rect(0, 36, pageW, 1.5, "F");

  doc.addImage(PDF_BRAND_MARK_DATA_URL, "PNG", margin, 8, 14, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SWAHILI TRAIL", margin + 18, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 210, 215);
  doc.text("Payment receipt · Kenya travel", margin + 18, 20);
  y = 48;

  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(input.planLabel, margin, y);
  y += 7;
  if (input.planDetail) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    doc.text(input.planDetail, margin, y);
    y += 8;
  } else {
    y += 4;
  }

  doc.setDrawColor(210, 220, 222);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 10;

  const rows: [string, string][] = [
    ["Status", "Paid"],
    ["Date", formatWhen(input.paidAt)],
  ];
  if (input.reference) rows.push(["Reference", input.reference]);
  if (input.paidWith) rows.push(["Paid with", input.paidWith]);
  if (input.billedTo) rows.push(["Billed to", input.billedTo]);
  if (input.email) rows.push(["Email", input.email]);

  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.ink);
    const lines = doc.splitTextToSize(value, contentW * 0.55) as string[];
    doc.text(lines, margin + contentW * 0.38, y);
    y += Math.max(7, lines.length * 5 + 2);
  }

  y += 4;
  doc.setDrawColor(210, 220, 222);
  doc.line(margin, y, margin + contentW, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text("Description", margin, y);
  doc.text("Amount", margin + contentW - 2, y, { align: "right" });
  y += 7;

  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.text(input.planLabel, margin, y);
  doc.text(input.subtotalFormatted ?? input.amountFormatted, margin + contentW - 2, y, {
    align: "right",
  });
  y += 8;

  if (input.taxFormatted) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text("Tax", margin, y);
    doc.text(input.taxFormatted, margin + contentW - 2, y, { align: "right" });
    y += 8;
  }

  doc.setDrawColor(210, 220, 222);
  doc.line(margin, y, margin + contentW, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.ink);
  doc.text("TOTAL PAID", margin, y);
  doc.text(input.amountFormatted, margin + contentW - 2, y, { align: "right" });
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    "Thank you for supporting Swahili Trail. Keep this receipt for your records.",
    margin,
    y,
  );

  doc.save(filename);
}
