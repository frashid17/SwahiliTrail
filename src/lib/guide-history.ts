export type GuideMessage = { role: "user" | "assistant"; content: string };

export type GuideSession = {
  id: string;
  title: string;
  language: string;
  messages: GuideMessage[];
  updatedAt: string;
  createdAt: string;
};

const STORAGE_PREFIX = "swahili-trail-guide:";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function readAll(userId: string): GuideSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuideSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(userId: string, sessions: GuideSession[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(sessions));
}

export function listGuideSessions(userId: string): GuideSession[] {
  return readAll(userId).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getGuideSession(
  userId: string,
  sessionId: string,
): GuideSession | null {
  return readAll(userId).find((s) => s.id === sessionId) ?? null;
}

export function saveGuideSession(
  userId: string,
  session: GuideSession,
): GuideSession {
  const sessions = readAll(userId).filter((s) => s.id !== session.id);
  sessions.unshift(session);
  const next = sessions.slice(0, 40);
  writeAll(userId, next);
  void pushSessionsToCloud(next);
  return session;
}

export function deleteGuideSession(userId: string, sessionId: string) {
  const next = readAll(userId).filter((s) => s.id !== sessionId);
  writeAll(userId, next);
  void fetch(`/api/guide/sessions?id=${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  }).catch(() => undefined);
  void pushSessionsToCloud(next);
}

export function createGuideSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function titleFromMessages(messages: GuideMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New coastal chat";
  const trimmed = firstUser.content.trim().replace(/\s+/g, " ");
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}

function sessionStamp(session: GuideSession) {
  return new Date(session.updatedAt).getTime();
}

export function mergeGuideSessions(
  local: GuideSession[],
  remote: GuideSession[],
): GuideSession[] {
  const map = new Map<string, GuideSession>();
  for (const session of [...local, ...remote]) {
    const prev = map.get(session.id);
    if (!prev || sessionStamp(session) >= sessionStamp(prev)) {
      map.set(session.id, session);
    }
  }
  return [...map.values()]
    .sort((a, b) => sessionStamp(b) - sessionStamp(a))
    .slice(0, 40);
}

async function pushSessionsToCloud(sessions: GuideSession[]) {
  try {
    await fetch("/api/guide/sessions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions }),
    });
  } catch {
    // Offline / not configured — local copy remains.
  }
}

/**
 * Load local guide history, pull cloud copy, merge, and push up.
 * Makes past chats available on both localhost and production.
 */
export async function syncGuideSessionsFromCloud(
  userId: string,
): Promise<GuideSession[]> {
  const local = listGuideSessions(userId);
  try {
    const res = await fetch("/api/guide/sessions", { cache: "no-store" });
    if (!res.ok) return local;
    const data = (await res.json()) as {
      sessions?: GuideSession[];
      cloud?: boolean;
    };
    const remote = Array.isArray(data.sessions) ? data.sessions : [];
    const merged = mergeGuideSessions(local, remote);
    writeAll(userId, merged);
    if (data.cloud) {
      await pushSessionsToCloud(merged);
    }
    return merged;
  } catch {
    return local;
  }
}
