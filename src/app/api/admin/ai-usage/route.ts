import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  action: z.enum(["reset"]),
  userId: z.string().min(3).max(120),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

function currentPeriod() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  try {
    const body = bodySchema.parse(await req.json());
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 },
      );
    }

    const period = body.period ?? currentPeriod();
    const { error } = await supabase.from("ai_usage").upsert(
      {
        user_id: body.userId.trim(),
        period,
        count: 0,
        last_source: "admin_reset",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,period" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `AI usage reset for ${period}`,
      period,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI usage action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
