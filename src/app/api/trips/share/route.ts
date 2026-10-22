import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeShareToken, type ShareCreateBody } from "@/lib/trip-share";
import { putMemoryShare } from "@/lib/trip-share-store";

export async function POST(req: Request) {
  const { userId } = await auth();
  const body = (await req.json().catch(() => null)) as ShareCreateBody | null;
  if (!body?.plan?.title || !body.startDate) {
    return NextResponse.json({ error: "Invalid trip payload" }, { status: 400 });
  }

  const token = makeShareToken();
  const title = body.plan.title;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const row = {
    token,
    user_id: userId ?? null,
    trip_id: body.tripId ?? null,
    title,
    payload: body,
    created_at: createdAt,
    expires_at: expiresAt.toISOString(),
  };

  putMemoryShare(token, {
    payload: body,
    title,
    createdAt,
    userId: userId ?? null,
    expiresAt: expiresAt.toISOString(),
  });

  const supabase = createAdminClient();
  if (supabase) {
    const { error } = await supabase.from("trip_shares").upsert(row, {
      onConflict: "token",
    });
    if (error) console.error("[trip-share] upsert", error.message);
    else {
      void supabase.from("analytics_events").insert({
        user_id: userId ?? null,
        event_type: "trip_shared",
        payload: { token, title },
      });
    }
  }

  return NextResponse.json({
    token,
    url: `/s/${token}`,
    expiresAt: expiresAt.toISOString(),
  });
}
