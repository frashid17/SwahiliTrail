import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { GuideSession } from "@/lib/guide-history";
import { createAdminClient } from "@/lib/supabase/admin";

const sessionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  language: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type SessionRow = {
  id: string;
  user_id: string | null;
  title: string | null;
  language: string;
  messages: GuideSession["messages"];
  created_at: string;
  updated_at: string;
};

function rowToSession(row: SessionRow): GuideSession {
  return {
    id: row.id,
    title: row.title || "Coastal chat",
    language: row.language,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sessionToRow(userId: string, session: GuideSession) {
  return {
    id: session.id,
    user_id: userId,
    title: session.title,
    language: session.language,
    messages: session.messages,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ sessions: [], cloud: false });
  }

  const { data, error } = await supabase
    .from("guide_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("[guide sessions GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    sessions: ((data ?? []) as SessionRow[]).map(rowToSession),
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
    const sessions = z.array(sessionSchema).max(40).parse(body.sessions ?? []);

    if (sessions.length === 0) {
      await supabase.from("guide_sessions").delete().eq("user_id", userId);
      return NextResponse.json({ sessions: [], cloud: true });
    }

    const rows = sessions.map((s) => sessionToRow(userId, s));
    const { error: upsertError } = await supabase
      .from("guide_sessions")
      .upsert(rows, { onConflict: "id" });

    if (upsertError) throw upsertError;

    const keepIds = sessions.map((s) => s.id);
    const { data: existing } = await supabase
      .from("guide_sessions")
      .select("id")
      .eq("user_id", userId);

    const toDelete = ((existing ?? []) as { id: string }[])
      .map((r) => r.id)
      .filter((id) => !keepIds.includes(id));

    if (toDelete.length > 0) {
      await supabase
        .from("guide_sessions")
        .delete()
        .eq("user_id", userId)
        .in("id", toDelete);
    }

    return NextResponse.json({ sessions, cloud: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync guide sessions";
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
    .from("guide_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cloud: true });
}
