import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";
import type { BrassGameState } from "./games/brass-birmingham/types";
import type { Session } from "./games/types";

// --- Sessions ---

export interface SessionDoc {
  code: string;
  gameSlug: string;
  hostUid: string;
  playerUids: string[];
  status: "lobby" | "active" | "paused" | "finished";
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
  gameState?: BrassGameState;
  sessionData?: Session;
}

export async function saveSession(
  sessionId: string,
  session: Session,
  gameState: BrassGameState | null
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, "sessions", sessionId);
  const data: Record<string, unknown> = {
    code: session.code,
    gameSlug: session.gameSlug,
    hostUid: session.hostPlayerId,
    playerUids: session.players.map((p) => p.id),
    status: session.status,
    updatedAt: serverTimestamp(),
    sessionData: session,
  };
  if (gameState) {
    data.gameState = gameState;
  }

  const snap = await getDoc(ref);
  if (!snap.exists()) {
    data.createdAt = serverTimestamp();
  }
  await setDoc(ref, data, { merge: true });
}

export async function loadSession(
  sessionId: string
): Promise<{ session: Session; gameState: BrassGameState | null } | null> {
  if (!firebaseDb) return null;
  const ref = doc(firebaseDb, "sessions", sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as SessionDoc;
  if (!data.sessionData) return null;
  return {
    session: data.sessionData,
    gameState: data.gameState ?? null,
  };
}

export async function findSessionByCode(
  code: string
): Promise<string | null> {
  if (!firebaseDb) return null;
  const q = query(
    collection(firebaseDb, "sessions"),
    where("code", "==", code),
    where("status", "in", ["lobby", "active", "paused"]),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function getUserSessions(
  uid: string
): Promise<{ id: string; data: SessionDoc }[]> {
  if (!firebaseDb) return [];
  const q = query(
    collection(firebaseDb, "sessions"),
    where("playerUids", "array-contains", uid),
    orderBy("updatedAt", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as SessionDoc }));
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionDoc["status"]
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, "sessions", sessionId);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}
