export type Era = "canal" | "rail";

export type Phase = "actions" | "end-of-round" | "end-of-era" | "game-over";

export type IndustryType =
  | "coal"
  | "iron"
  | "brewery"
  | "cotton"
  | "manufacturer"
  | "pottery";

export type TileStatus = "available" | "built" | "developed";

export interface BrassPlayerState {
  money: number;
  income: number; // can be negative
  vp: number;
  loans: number;
  industryStacks: Record<IndustryType, TileStatus[]>;
  lockedTiles: Record<IndustryType, boolean[]>; // true = permanent from previous round
}

export interface ActionHistoryEntry {
  action: BrassAction;
  timestamp: number;
}

/** Game state without the undo stack (used for snapshots). */
export type BrassGameStateSnapshot = Omit<BrassGameState, "_undoStack">;

export interface BrassGameState {
  era: Era;
  round: number; // 1-indexed
  phase: Phase;
  turnOrder: string[]; // player IDs, ordered
  activePlayerIndex: number;
  actionsRemainingForActivePlayer: number; // 1 or 2
  roundSpending: Record<string, number>; // playerId → £ spent this round
  playerStates: Record<string, BrassPlayerState>;
  history: ActionHistoryEntry[]; // action log for display
  _undoStack: BrassGameStateSnapshot[]; // state snapshots for real undo
}

// --- Actions ---

export type BrassAction =
  | { type: "RECORD_SPEND"; playerId: string; amount: number }
  | { type: "ADJUST_SPEND"; playerId: string; amount: number }
  | { type: "END_TURN" }
  | { type: "END_ROUND" }
  | { type: "NEXT_ERA" }
  | { type: "TAKE_LOAN"; playerId: string }
  | { type: "ADJUST_INCOME"; playerId: string; delta: number }
  | {
      type: "BUILD_TILE";
      playerId: string;
      industry: IndustryType;
      index: number; // position in the flat tile array
    }
  | {
      type: "DEVELOP_TILE";
      playerId: string;
      industry: IndustryType;
      index: number;
    }
  | {
      type: "CYCLE_TILE";
      playerId: string;
      industry: IndustryType;
      index: number;
    }
  | { type: "ADJUST_VP"; playerId: string; delta: number }
  | { type: "ADJUST_MONEY"; playerId: string; delta: number }
  | { type: "END_GAME" }
  | { type: "UNDO" };
