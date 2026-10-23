import { createHmac, timingSafeEqual } from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

/** Trail Plus display price (USD). */
export const TRAIL_PLUS_PRICE_USD = 6;

/** Default charge in smallest currency unit (780 KES → 78000 ≈ $6). Override via env. */
export function trailPlusAmountSubunits() {
  const raw = process.env.PAYSTACK_TRAIL_PLUS_AMOUNT;
  if (raw && /^\d+$/.test(raw)) return Number(raw);
  return 78000;
}

export function trailPlusCurrency() {
  return (process.env.PAYSTACK_CURRENCY || "KES").toUpperCase();
}

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

async function paystackFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = (await res.json()) as T & { status?: boolean; message?: string };
  if (!res.ok || (json as { status?: boolean }).status === false) {
    const msg =
      (json as { message?: string }).message || `Paystack ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export type PaystackInitResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export async function initializePaystackTransaction(input: {
  email: string;
  amount: number;
  currency: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  /** Our idempotent reference - reuse on retry so Paystack won't double-charge. */
  reference?: string;
  planCode?: string;
}): Promise<PaystackInitResult> {
  const body: Record<string, unknown> = {
    email: input.email,
    amount: input.amount,
    currency: input.currency,
    callback_url: input.callbackUrl,
    metadata: input.metadata,
  };
  if (input.reference) body.reference = input.reference;
  if (input.planCode) body.plan = input.planCode;

  const json = await paystackFetch<{ data: PaystackInitResult }>(
    "/transaction/initialize",
    { method: "POST", body: JSON.stringify(body) },
  );
  return json.data;
}

export type PaystackVerifyData = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  channel?: string;
  customer: { email?: string; customer_code?: string; id?: number };
  authorization?: {
    authorization_code?: string;
    reusable?: boolean;
    channel?: string;
  } | null;
  metadata?: Record<string, unknown> | null;
  plan?: { plan_code?: string } | null;
};

/**
 * Only Paystack `success` means money cleared.
 * Do not treat paid_at alone as paid — abandoned/ongoing can still look ambiguous.
 */
export function isPaystackChargeSuccess(tx: {
  status: string;
}): boolean {
  return tx.status === "success";
}

export function mapPaystackToPaymentStatus(tx: {
  status: string;
}): "success" | "pending" | "failed" {
  const s = (tx.status || "").toLowerCase();
  if (s === "success") return "success";
  if (
    s === "failed" ||
    s === "abandoned" ||
    s === "reversed" ||
    s === "cancelled" ||
    s === "canceled"
  ) {
    return "failed";
  }
  // ongoing | pending | processing | queued | ...
  return "pending";
}

/** Plan code for optional card auto-renew (M-Pesa stays one-time). */
export function trailPlusPlanCode() {
  const code = process.env.PAYSTACK_PLAN_CODE?.trim();
  return code || undefined;
}

/**
 * M-Pesa / mobile money cannot reliably auto-debit next month.
 * Only attach Paystack Plans when the charge left a reusable card auth.
 */
export async function maybeCreateCardSubscription(input: {
  customerCode: string;
  authorizationCode: string;
  planCode: string;
}): Promise<string | null> {
  try {
    const json = await paystackFetch<{
      data?: { subscription_code?: string };
    }>("/subscription/create", {
      method: "POST",
      body: JSON.stringify({
        customer: input.customerCode,
        plan: input.planCode,
        authorization: input.authorizationCode,
      }),
    });
    return json.data?.subscription_code ?? null;
  } catch (err) {
    console.warn(
      "[paystack] card subscription skipped",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export async function verifyPaystackTransaction(reference: string) {
  const json = await paystackFetch<{ data: PaystackVerifyData }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return json.data;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(hash);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type PaystackSubscription = {
  subscription_code: string;
  email_token?: string;
  status?: string;
  next_payment_date?: string;
  customer?: { customer_code?: string; email?: string };
};

export async function fetchPaystackSubscription(code: string) {
  const json = await paystackFetch<{ data: PaystackSubscription }>(
    `/subscription/${encodeURIComponent(code)}`,
  );
  return json.data;
}

/** Stop auto-renew on a Paystack subscription plan. */
export async function disablePaystackSubscription(code: string, token: string) {
  await paystackFetch("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code, token }),
  });
}

function normalizeAppOrigin(raw: string) {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return trimmed;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    // Never send Paystack callbacks over plain http on deployed hosts -
    // insecure redirects drop Secure auth cookies and look like a logout.
    if (
      url.protocol === "http:" &&
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1"
    ) {
      url.protocol = "https:";
    }
    return url.origin;
  } catch {
    return trimmed;
  }
}

export function appBaseUrl(req?: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeAppOrigin(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (req) {
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    if (host) return normalizeAppOrigin(`${proto}://${host}`);
  }
  if (process.env.VERCEL_URL) {
    return normalizeAppOrigin(`https://${process.env.VERCEL_URL}`);
  }
  return "http://localhost:3000";
}
