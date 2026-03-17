/**
 * Feature flags — flip these to enable/disable features.
 */
export const FEATURES = {
  /** Persist sessions to Firestore */
  PERSISTENCE: false,
  /** Firebase authentication (Google sign-in, UID-based player IDs) */
  AUTH: false,
} as const;
