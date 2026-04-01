import { create } from "zustand";
import type { DuneGameState } from "@/lib/games/dune-imperium/types";
import type { Session } from "@/lib/games/types";

interface DuneSessionStore {
  session: Session | null;
  gameState: DuneGameState | null;
  playerId: string | null;
  connected: boolean;

  setSession: (session: Session) => void;
  setGameState: (gameState: DuneGameState) => void;
  setPlayerId: (id: string) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useDuneSessionStore = create<DuneSessionStore>((set) => ({
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
