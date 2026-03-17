const KEY = "boardgames_active_session";

export interface ActiveSessionInfo {
  sessionId: string;
  gameSlug: string;
  playerName: string;
  joinedAt: number;
}

export function saveActiveSession(info: ActiveSessionInfo): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(info));
}

export function getActiveSession(): ActiveSessionInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
