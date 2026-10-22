import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShareCreateBody } from "@/lib/trip-share";
import { getMemoryShare } from "@/lib/trip-share-store";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("trip_shares")
      .select("token, title, payload, created_at, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!error && data) {
      if (
        data.expires_at &&
        new Date(data.expires_at as string).getTime() < Date.now()
      ) {
        return NextResponse.json({ error: "Share expired" }, { status: 410 });
      }
      return NextResponse.json({
        token: data.token,
        title: data.title,
        createdAt: data.created_at,
        trip: data.payload as ShareCreateBody,
      });
    }
  }

  const mem = getMemoryShare(token);
  if (!mem) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  return NextResponse.json({
    token,
    title: mem.title,
    createdAt: mem.createdAt,
    trip: mem.payload,
  });
}
