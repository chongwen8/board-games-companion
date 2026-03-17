import { firebaseAuth } from "@/lib/firebase";
import { FEATURES } from "@/lib/config";

const STORAGE_KEY = "boardgames_player_id";
const NAME_KEY = "boardgames_player_name";

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get player ID. Uses Firebase UID if auth is enabled and signed in,
 * otherwise localStorage UUID.
 */
export function getPlayerId(): string {
  if (FEATURES.AUTH && firebaseAuth?.currentUser) {
    return firebaseAuth.currentUser.uid;
  }
  if (typeof window === "undefined") return generateId();
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function getPlayerName(): string {
  if (FEATURES.AUTH && firebaseAuth?.currentUser?.displayName) {
    return firebaseAuth.currentUser.displayName;
  }
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function setPlayerName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
}
