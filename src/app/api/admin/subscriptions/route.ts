import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/access";
import {
  activateTrailPlus,
  deactivateTrailPlus,
  getSubscription,
} from "@/lib/ai/subscription";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  action: z.enum(["grant", "extend", "revoke", "set_status"]),
  userId: z.string().min(3).max(120),
  email: z.string().email().optional().nullable(),
  days: z.number().int().min(1).max(365).optional(),
  status: z
    .enum(["active", "inactive", "past_due", "cancelled"])
    .optional(),
});

function addDays(from: Date, days: number) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  try {
    const body = bodySchema.parse(await req.json());
    const userId = body.userId.trim();
    const days = body.days ?? 30;

    if (body.action === "revoke") {
      await deactivateTrailPlus(userId);
      return NextResponse.json({
        ok: true,
        message: "Trail Plus revoked (cancelled)",
      });
    }

    if (body.action === "set_status") {
      if (!body.status) {
        return NextResponse.json(
          { error: "status is required" },
          { status: 400 },
        );
      }
      const supabase = createAdminClient();
      if (!supabase) {
        return NextResponse.json(
          { error: "Supabase is not configured" },
          { status: 503 },
        );
      }
      const { error } = await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          status: body.status,
          plan: "trail_plus",
          provider: "paystack",
          email: body.email ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        message: `Subscription set to ${body.status}`,
      });
    }

    const existing = await getSubscription(userId);
    const base =
      existing?.current_period_end &&
      new Date(existing.current_period_end).getTime() > Date.now()
        ? new Date(existing.current_period_end)
        : new Date();
    const periodEnd = addDays(base, days).toISOString();
    const reference =
      body.action === "extend"
        ? `admin-extend-${Date.now()}`
        : `admin-grant-${Date.now()}`;

    await activateTrailPlus({
      userId,
      email: body.email ?? existing?.email ?? null,
      reference,
      periodEnd,
    });

    return NextResponse.json({
      ok: true,
      message:
        body.action === "extend"
          ? `Extended Trail Plus by ${days} days`
          : `Granted Trail Plus for ${days} days`,
      periodEnd,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Subscription action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
