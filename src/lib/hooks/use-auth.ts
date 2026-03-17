"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "firebase/auth";
import {
  subscribeToAuth,
  signInWithGoogle as firebaseSignIn,
  signOut as firebaseSignOut,
  ensureUserProfile,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { FEATURES } from "@/lib/config";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    configured: FEATURES.AUTH && isFirebaseConfigured(),
  });

  useEffect(() => {
    if (!state.configured) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const unsubscribe = subscribeToAuth((user) => {
      setState({ user, loading: false, configured: true });
      if (user) {
        ensureUserProfile(user).catch(console.error);
      }
    });

    return unsubscribe;
  }, [state.configured]);

  const signIn = useCallback(async () => {
    return firebaseSignIn();
  }, []);

  const signOut = useCallback(async () => {
    return firebaseSignOut();
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    configured: state.configured,
    signIn,
    signOut,
  };
}
