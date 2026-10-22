import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, getAdminEmails } from "@/lib/admin/access";
import {
  getAdminSettings,
  updateAdminSettings,
} from "@/lib/admin/settings";
import { isPaystackConfigured } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  trailPlusSalesEnabled: z.boolean().optional(),
  freeAiMonthlyCap: z.number().int().min(0).nullable().optional(),
  opsNote: z.string().max(2000).optional(),
});

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  const settings = await getAdminSettings();
  return NextResponse.json({
    settings,
    runtime: {
      adminEmailCount: getAdminEmails().length,
      supabaseConfigured: Boolean(createAdminClient()),
      paystackConfigured: isPaystackConfigured(),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    },
  });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: gate.status });
  }

  try {
    const body = patchSchema.parse(await req.json());
    const settings = await updateAdminSettings(body, gate.email);
    return NextResponse.json({ settings });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
