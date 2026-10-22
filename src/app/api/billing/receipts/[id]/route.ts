import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  formatMoney,
  getPaymentForUser,
} from "@/lib/ai/subscription";

const LOGO_SVG = `<svg viewBox="0 0 128 128" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="128" height="128" rx="16" fill="#043844"/>
  <path d="M18 104C36 96 48 78 56 58c8-20 18-36 40-42 6-1.5 14-1 22 1-10 14-16 30-20 48-5 22-14 40-36 52-12 7-28 8-44-13z" fill="#E8F7F6"/>
  <path d="M24 86c16-22 30-26 48-20 14 5 24 2 36-10 1 16-4 32-16 44-14 14-34 18-52 10-12-5-18-14-16-24z" fill="#1AA6B5"/>
  <path d="M42 54c12-10 26-12 40-4 8 4 16 2 24-4-6 14-16 24-30 28-12 4-24-2-34-20z" fill="#5ED4DE"/>
</svg>`;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const payment = await getPaymentForUser(userId, id);
  if (!payment) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  if (payment.status !== "success") {
    return NextResponse.json(
      {
        error:
          payment.status === "pending"
            ? "Payment is still pending - receipt unlocks after Paystack confirms success."
            : "Receipt is only available for successful payments.",
      },
      { status: 409 },
    );
  }

  const user = await currentUser();
  const name =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Traveler";
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";

  const paidAt = payment.paid_at
    ? new Date(payment.paid_at).toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const amount = formatMoney(payment.amount, payment.currency);
  const receiptNo = payment.receipt_number || payment.reference;
  const filename = `swahili-trail-receipt-${receiptNo}.html`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(receiptNo)} · Swahili Trail</title>
  <style>
    body { font-family: Figtree, system-ui, sans-serif; color: #0a2428; margin: 40px; background: #f7f8f5; }
    .sheet { max-width: 560px; margin: 0 auto; background: #fff; border: 1px solid #d5dde3; border-radius: 16px; padding: 28px; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .brand-name { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .brand-name span { color: #1a7a7e; }
    .muted { color: #5a7072; font-size: 13px; }
    .box { border: 1px solid #d5dde3; border-radius: 12px; padding: 20px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #e8eef2; font-size: 14px; }
    .total { font-size: 18px; font-weight: 700; }
    .status { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #e6efeb; color: #0c3d42; font-size: 12px; font-weight: 600; }
    @media print { body { margin: 16px; background: #fff; } .noprint { display: none; } .sheet { border: none; } }
  </style>
</head>
<body>
  <p class="muted noprint"><button onclick="window.print()">Print / Save as PDF</button></p>
  <div class="sheet">
    <div class="brand">
      ${LOGO_SVG}
      <div>
        <div class="brand-name">Swahili <span>Trail</span></div>
        <p class="muted">Payment receipt</p>
      </div>
    </div>
    <div class="box">
      <p><strong>Receipt</strong> ${escapeHtml(receiptNo)}</p>
      <p><strong>Billed to</strong> ${escapeHtml(name)}${email ? ` · ${escapeHtml(email)}` : ""}</p>
      <p><strong>Paid</strong> ${paidAt}</p>
      <p><strong>Status</strong> <span class="status">${escapeHtml(payment.status)}</span></p>
      <p><strong>Reference</strong> ${escapeHtml(payment.reference)}</p>
      <table>
        <thead>
          <tr><th>Description</th><th>Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(payment.description || "Trail Plus")}</td>
            <td>${escapeHtml(amount)}</td>
          </tr>
          <tr>
            <td class="total">Total</td>
            <td class="total">${escapeHtml(amount)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="muted" style="margin-top:24px">Thank you for supporting Swahili Trail · Kenya travel.</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
