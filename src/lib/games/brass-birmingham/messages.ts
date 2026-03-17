import type { BrassAction, BrassGameState } from "./types";
import type { Player, Session } from "../types";

/** Messages from client → PartyKit server */
export type ClientMessage =
  | { type: "CREATE_SESSION"; player: Pick<Player, "id" | "name"> }
  | { type: "JOIN_SESSION"; player: Pick<Player, "id" | "name">; code: string }
  | { type: "ADD_BOT" }
  | { type: "REMOVE_BOT"; botId: string }
  | { type: "START_GAME"; playerCount: number }
  | { type: "GAME_ACTION"; action: BrassAction };

/** Messages from PartyKit server → client */
export type ServerMessage =
  | { type: "SESSION_CREATED"; session: Session }
  | { type: "SESSION_UPDATED"; session: Session }
  | { type: "GAME_STATE"; gameState: BrassGameState }
  | { type: "ERROR"; message: string };
