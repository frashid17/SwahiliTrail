import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  action: z.enum(["purge_older_than_days", "purge_all_sampled"]),
  days: z.number().int().min(1).max(365).optional(),
});

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

    if (body.action === "purge_all_sampled") {
      // Delete the most recent 500 rows (console sample window).
      const { data, error: selectError } = await supabase
        .from("analytics_events")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (selectError) {
        return NextResponse.json(
          { error: selectError.message },
          { status: 500 },
        );
      }
      const ids = (data ?? []).map((r) => r.id as string).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ ok: true, deleted: 0 });
      }
      const { error } = await supabase
        .from("analytics_events")
        .delete()
        .in("id", ids);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        deleted: ids.length,
        message: `Deleted ${ids.length} recent events`,
      });
    }

    const days = body.days ?? 30;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    const { error, count } = await supabase
      .from("analytics_events")
      .delete({ count: "exact" })
      .lt("created_at", cutoff.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      deleted: count ?? 0,
      message: `Purged events older than ${days} days`,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Events action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
