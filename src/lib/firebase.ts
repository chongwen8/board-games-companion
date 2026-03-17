import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  setPersistence,
  onIdTokenChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if config is present (allows running without Firebase)
function isConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

const app = isConfigured()
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth = app ? getAuth(app) : null;
export const firebaseDb = app ? getFirestore(app) : null;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let persistenceReady = false;

async function ensurePersistence() {
  if (persistenceReady || !firebaseAuth) return;
  await setPersistence(firebaseAuth, browserLocalPersistence);
  persistenceReady = true;
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!firebaseAuth) return null;
  await ensurePersistence();
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      return null;
    }
    throw err;
  }
}

export async function signOut(): Promise<void> {
  if (!firebaseAuth) return;
  await firebaseAuth.signOut();
}

export async function getIdToken(): Promise<string | null> {
  if (!firebaseAuth?.currentUser) return null;
  return firebaseAuth.currentUser.getIdToken();
}

export function subscribeToAuth(
  callback: (user: User | null) => void
): () => void {
  if (!firebaseAuth) {
    callback(null);
    return () => {};
  }
  return onIdTokenChanged(firebaseAuth, callback);
}

// --- Firestore: User profile ---

export async function ensureUserProfile(user: User): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: user.displayName,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, { lastActiveAt: serverTimestamp() }, { merge: true });
  }
}

export { isConfigured as isFirebaseConfigured };
