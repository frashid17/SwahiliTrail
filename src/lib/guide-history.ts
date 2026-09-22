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
  writeAll(userId, sessions.slice(0, 40));
  return session;
}

export function deleteGuideSession(userId: string, sessionId: string) {
  writeAll(
    userId,
    readAll(userId).filter((s) => s.id !== sessionId),
  );
}

export function createGuideSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `guide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function titleFromMessages(messages: GuideMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New coastal chat";
  const trimmed = firstUser.content.trim().replace(/\s+/g, " ");
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}
