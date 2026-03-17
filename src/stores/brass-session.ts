import { create } from "zustand";
import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { Session } from "@/lib/games/types";

interface BrassSessionStore {
  session: Session | null;
  gameState: BrassGameState | null;
  playerId: string | null;
  connected: boolean;

  setSession: (session: Session) => void;
  setGameState: (gameState: BrassGameState) => void;
  setPlayerId: (id: string) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useBrassSessionStore = create<BrassSessionStore>((set) => ({
  session: null,
  gameState: null,
  playerId: null,
  connected: false,

  setSession: (session) => set({ session }),
  setGameState: (gameState) => set({ gameState }),
  setPlayerId: (playerId) => set({ playerId }),
  setConnected: (connected) => set({ connected }),
  reset: () =>
    set({
      session: null,
      gameState: null,
      playerId: null,
      connected: false,
    }),
}));
