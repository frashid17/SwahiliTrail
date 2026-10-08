import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  formatMoney,
  getPaymentForUser,
} from "@/lib/ai/subscription";

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
    : "—";

  const amount = formatMoney(payment.amount, payment.currency);
  const receiptNo = payment.receipt_number || payment.reference;
  const filename = `swahili-trail-receipt-${receiptNo}.html`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${receiptNo}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #0c2a3a; margin: 40px; }
    h1 { font-size: 28px; margin: 0 0 4px; }
    .muted { color: #5b6b75; font-size: 14px; }
    .box { border: 1px solid #d5dde3; border-radius: 12px; padding: 20px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #e8eef2; font-size: 14px; }
    .total { font-size: 18px; font-weight: 700; }
    @media print { body { margin: 16px; } .noprint { display: none; } }
  </style>
</head>
<body>
  <p class="muted noprint"><button onclick="window.print()">Print / Save as PDF</button></p>
  <h1>Swahili Trail</h1>
  <p class="muted">Payment receipt</p>
  <div class="box">
    <p><strong>Receipt</strong> ${receiptNo}</p>
    <p><strong>Billed to</strong> ${escapeHtml(name)}${email ? ` · ${escapeHtml(email)}` : ""}</p>
    <p><strong>Paid</strong> ${paidAt}</p>
    <p><strong>Status</strong> ${escapeHtml(payment.status)}</p>
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
  <p class="muted" style="margin-top:24px">Thank you for supporting Swahili Trail.</p>
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
