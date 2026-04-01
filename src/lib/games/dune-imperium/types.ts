// --- Dune: Imperium game types ---
// Faction IDs — Uprising can extend this union with additional factions
export type FactionId = "emperor" | "spacingGuild" | "beneGesserit" | "fremen";

export type DunePhase = "playing" | "game-over";

export interface FactionInfluence {
  level: number;       // 0 to maxInfluence (typically 6)
  hasAlliance: boolean; // true if this player holds the alliance token
}

export interface DunePlayerState {
  spice: number;
  solari: number;
  water: number;
  vp: number;
  intrigue: number;
  factions: Record<FactionId, FactionInfluence>;
}

export interface ActionHistoryEntry {
  action: DuneAction;
  timestamp: number;
}

export type DuneGameStateSnapshot = Omit<DuneGameState, "_undoStack">;

export interface DuneGameState {
  round: number;
  phase: DunePhase;
  turnOrder: string[];       // player IDs
  activePlayerIndex: number;
  playerStates: Record<string, DunePlayerState>;
  /** Tracks who holds each faction's alliance token. null = unclaimed. */
  allianceHolders: Record<FactionId, string | null>;
  history: ActionHistoryEntry[];
  _undoStack: DuneGameStateSnapshot[];
}

// --- Actions ---
export type DuneAction =
  | { type: "ADJUST_SPICE"; playerId: string; delta: number }
  | { type: "ADJUST_SOLARI"; playerId: string; delta: number }
  | { type: "ADJUST_WATER"; playerId: string; delta: number }
  | { type: "ADJUST_VP"; playerId: string; delta: number }
  | { type: "ADJUST_INTRIGUE"; playerId: string; delta: number }
  | { type: "ADJUST_INFLUENCE"; playerId: string; faction: FactionId; delta: number }
  | { type: "NEXT_ROUND" }
  | { type: "END_GAME" }
  | { type: "UNDO" };
