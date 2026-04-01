import type { DuneAction, DuneGameState } from "./types";
import type { Player, Session } from "../types";

export type ClientMessage =
  | { type: "CREATE_SESSION"; player: Pick<Player, "id" | "name"> }
  | { type: "JOIN_SESSION"; player: Pick<Player, "id" | "name">; code: string }
  | { type: "ADD_BOT" }
  | { type: "REMOVE_BOT"; botId: string }
  | { type: "START_GAME"; playerCount: number }
  | { type: "RESET_GAME" }
  | { type: "END_SESSION" }
  | { type: "GAME_ACTION"; action: DuneAction };

export type ServerMessage =
  | { type: "SESSION_CREATED"; session: Session }
  | { type: "SESSION_UPDATED"; session: Session }
  | { type: "GAME_STATE"; gameState: DuneGameState }
  | { type: "SESSION_ENDED" }
  | { type: "ERROR"; message: string };
