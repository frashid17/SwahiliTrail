import type { ShareCreateBody } from "@/lib/trip-share";

type MemoryShare = {
  payload: ShareCreateBody;
  title: string;
  createdAt: string;
  userId: string | null;
  expiresAt: string;
};

const memoryShares = new Map<string, MemoryShare>();

export function putMemoryShare(token: string, share: MemoryShare) {
  memoryShares.set(token, share);
}

export function getMemoryShare(token: string) {
  const hit = memoryShares.get(token);
  if (!hit) return null;
  if (new Date(hit.expiresAt).getTime() < Date.now()) {
    memoryShares.delete(token);
    return null;
  }
  return hit;
}
