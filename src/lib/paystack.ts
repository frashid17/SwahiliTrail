import { createHmac, timingSafeEqual } from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

/** Trail Plus display price (USD). */
export const TRAIL_PLUS_PRICE_USD = 4;

/** Default charge in smallest currency unit (520 KES → 52000). Override via env. */
export function trailPlusAmountSubunits() {
  const raw = process.env.PAYSTACK_TRAIL_PLUS_AMOUNT;
  if (raw && /^\d+$/.test(raw)) return Number(raw);
  return 52000;
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
  planCode?: string;
}): Promise<PaystackInitResult> {
  const body: Record<string, unknown> = {
    email: input.email,
    amount: input.amount,
    currency: input.currency,
    callback_url: input.callbackUrl,
    metadata: input.metadata,
  };
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
  customer: { email?: string; customer_code?: string };
  metadata?: Record<string, unknown> | null;
  plan?: { plan_code?: string } | null;
};

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

export function appBaseUrl(req?: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (req) {
    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}
