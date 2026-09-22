import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SavedTrip } from "@/lib/saved-trips";

const tripSchema = z.object({
  id: z.string().min(1),
  savedAt: z.string(),
  startDate: z.string(),
  days: z.number().int().min(1).max(30),
  partySize: z.number().int().min(1).max(50),
  companions: z.string(),
  budget: z.string(),
  transportMode: z.string(),
  plan: z.any(),
  status: z.enum(["upcoming", "completed"]),
  completedAt: z.string().optional(),
});

type TripRow = {
  id: string;
  user_id: string;
  start_date: string;
  days: number;
  party_size: number;
  companions: string | null;
  budget: string | null;
  transport_mode: string | null;
  plan: SavedTrip["plan"];
  status: "upcoming" | "completed";
  completed_at: string | null;
  saved_at: string;
};

function rowToTrip(row: TripRow): SavedTrip {
  return {
    id: row.id,
    savedAt: row.saved_at,
    startDate: row.start_date,
    days: row.days,
    partySize: row.party_size,
    companions: row.companions ?? "family",
    budget: row.budget ?? "mid",
    transportMode: row.transport_mode ?? "none",
    plan: row.plan,
    status: row.status === "completed" ? "completed" : "upcoming",
    completedAt: row.completed_at ?? undefined,
  };
}

function tripToRow(userId: string, trip: SavedTrip) {
  return {
    id: trip.id,
    user_id: userId,
    start_date: trip.startDate,
    days: trip.days,
    party_size: trip.partySize,
    companions: trip.companions,
    budget: trip.budget,
    transport_mode: trip.transportMode,
    plan: trip.plan,
    status: trip.status,
    completed_at: trip.completedAt ?? null,
    saved_at: trip.savedAt,
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ trips: [], cloud: false });
  }

  const { data, error } = await supabase
    .from("saved_trips")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    console.error("[trips GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    trips: ((data ?? []) as TripRow[]).map(rowToTrip),
    cloud: true,
  });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Cloud sync not configured", cloud: false },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const trips = z.array(tripSchema).max(40).parse(body.trips ?? []);

    if (trips.length === 0) {
      await supabase.from("saved_trips").delete().eq("user_id", userId);
      return NextResponse.json({ trips: [], cloud: true });
    }

    const rows = trips.map((t) => tripToRow(userId, t as SavedTrip));
    const { error: upsertError } = await supabase
      .from("saved_trips")
      .upsert(rows, { onConflict: "id" });

    if (upsertError) throw upsertError;

    const keepIds = trips.map((t) => t.id);
    const { data: existing } = await supabase
      .from("saved_trips")
      .select("id")
      .eq("user_id", userId);

    const toDelete = ((existing ?? []) as { id: string }[])
      .map((r) => r.id)
      .filter((id) => !keepIds.includes(id));

    if (toDelete.length > 0) {
      await supabase
        .from("saved_trips")
        .delete()
        .eq("user_id", userId)
        .in("id", toDelete);
    }

    return NextResponse.json({ trips, cloud: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync trips";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Cloud sync not configured", cloud: false },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("saved_trips")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cloud: true });
}
