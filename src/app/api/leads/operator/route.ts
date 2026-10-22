import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type LeadBody = {
  name?: string;
  email?: string;
  phone?: string;
  partySize?: number;
  startDate?: string;
  notes?: string;
  tripTitle?: string;
  shareToken?: string;
  source?: string;
};

const memoryLeads: (LeadBody & { id: string; createdAt: string })[] = [];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LeadBody | null;
  const name = body?.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!body?.email?.trim() && !body?.phone?.trim()) {
    return NextResponse.json(
      { error: "Add an email or WhatsApp number so operators can reply." },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const row = {
    id,
    share_token: body?.shareToken ?? null,
    name,
    email: body?.email?.trim() || null,
    phone: body?.phone?.trim() || null,
    party_size: body?.partySize ?? null,
    start_date: body?.startDate ?? null,
    notes: body?.notes?.trim() || null,
    trip_title: body?.tripTitle ?? null,
    source: body?.source ?? "share_page",
    status: "new",
    created_at: createdAt,
  };

  memoryLeads.unshift({
    id,
    createdAt,
    name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    partySize: row.party_size ?? undefined,
    startDate: row.start_date ?? undefined,
    notes: row.notes ?? undefined,
    tripTitle: row.trip_title ?? undefined,
    shareToken: row.share_token ?? undefined,
    source: row.source,
  });

  const supabase = createAdminClient();
  if (supabase) {
    const { error } = await supabase.from("operator_leads").insert(row);
    if (error) console.error("[operator-lead]", error.message);
    else {
      void supabase.from("analytics_events").insert({
        event_type: "operator_lead",
        payload: {
          source: row.source,
          tripTitle: row.trip_title,
          shareToken: row.share_token,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    id,
    message:
      "Thanks - a Swahili Trail partner will reach out about stays, transfers, and guiding.",
  });
}
