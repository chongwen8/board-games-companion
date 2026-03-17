import type * as Party from "partykit/server";
import { brassReducer } from "../src/lib/games/brass-birmingham/reducer";
import type {
  ClientMessage,
  ServerMessage,
} from "../src/lib/games/brass-birmingham/messages";
import type { Session } from "../src/lib/games/types";
import { generateSessionCode } from "../src/lib/utils/session-code";
import {
  INDUSTRY_TILE_LEVELS,
  STARTING_INCOME_SPACE,
  STARTING_MONEY,
} from "../src/lib/games/brass-birmingham/constants";
import type { BrassGameState, IndustryType, TileStatus } from "../src/lib/games/brass-birmingham/types";

const BOT_NAMES = ["Alice (bot)", "Bob (bot)", "Carol (bot)"];

function createInitialPlayerState(playerCount: number): {
  money: number;
  income: number;
  vp: number;
  loans: number;
  industryStacks: Record<IndustryType, TileStatus[]>;
} {
  const stacks = {} as Record<IndustryType, TileStatus[]>;
  for (const [industry, tileLevels] of Object.entries(INDUSTRY_TILE_LEVELS)) {
    // One "available" entry per tile (array length = actual tile count)
    stacks[industry as IndustryType] = tileLevels.map(() => "available" as TileStatus);
  }
  return {
    money: STARTING_MONEY[playerCount] ?? 30,
    income: STARTING_INCOME_SPACE,
    vp: 0,
    loans: 0,
    industryStacks: stacks,
  };
}

export default class BrassBirminghamServer implements Party.Server {
  session: Session | null = null;
  gameState: BrassGameState | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Send current state to newly connected/reconnected client
    if (this.session) {
      conn.send(
        JSON.stringify({
          type: "SESSION_UPDATED",
          session: this.session,
        } satisfies ServerMessage)
      );
    }
    if (this.gameState) {
      conn.send(
        JSON.stringify({
          type: "GAME_STATE",
          gameState: this.gameState,
        } satisfies ServerMessage)
      );
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as ClientMessage;

    switch (msg.type) {
      case "CREATE_SESSION": {
        this.session = {
          id: this.room.id,
          code: generateSessionCode(),
          gameSlug: "brass-birmingham",
          hostPlayerId: msg.player.id,
          players: [
            {
              id: msg.player.id,
              name: msg.player.name,
              color: "red",
              seatOrder: 0,
              connected: true,
            },
          ],
          status: "lobby",
        };
        this.broadcast(
          JSON.stringify({
            type: "SESSION_CREATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        break;
      }

      case "JOIN_SESSION": {
        if (!this.session) {
          sender.send(
            JSON.stringify({
              type: "ERROR",
              message: "No session exists",
            } satisfies ServerMessage)
          );
          return;
        }
        if (this.session.status !== "lobby") {
          sender.send(
            JSON.stringify({
              type: "ERROR",
              message: "Game already started",
            } satisfies ServerMessage)
          );
          return;
        }
        // Check if player already in session (reconnecting)
        const existing = this.session.players.find(
          (p) => p.id === msg.player.id
        );
        if (existing) {
          existing.connected = true;
          existing.name = msg.player.name;
        } else {
          if (this.session.players.length >= 4) {
            sender.send(
              JSON.stringify({
                type: "ERROR",
                message: "Session is full",
              } satisfies ServerMessage)
            );
            return;
          }
          const colors = ["red", "yellow", "green", "purple"] as const;
          const usedColors = new Set(this.session.players.map((p) => p.color));
          const nextColor =
            colors.find((c) => !usedColors.has(c)) ?? "red";
          this.session.players.push({
            id: msg.player.id,
            name: msg.player.name,
            color: nextColor,
            seatOrder: this.session.players.length,
            connected: true,
          });
        }
        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        break;
      }

      case "ADD_BOT": {
        if (!this.session || this.session.status !== "lobby") return;
        if (this.session.players.length >= 4) return;
        const colors = ["red", "yellow", "green", "purple"] as const;
        const usedColors = new Set(this.session.players.map((p) => p.color));
        const nextColor = colors.find((c) => !usedColors.has(c)) ?? "red";
        const botIndex = this.session.players.filter((p) =>
          p.id.startsWith("bot-")
        ).length;
        const botId = `bot-${crypto.randomUUID().slice(0, 8)}`;
        this.session.players.push({
          id: botId,
          name: BOT_NAMES[botIndex] ?? `Bot ${botIndex + 1}`,
          color: nextColor,
          seatOrder: this.session.players.length,
          connected: true,
        });
        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        break;
      }

      case "REMOVE_BOT": {
        if (!this.session || this.session.status !== "lobby") return;
        this.session.players = this.session.players.filter(
          (p) => p.id !== msg.botId
        );
        // Reassign seat orders
        this.session.players.forEach((p, i) => {
          p.seatOrder = i;
        });
        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        break;
      }

      case "START_GAME": {
        if (!this.session) return;
        // Only the session creator (admin) can start the game
        // sender.id is the WebSocket connection ID, not playerId,
        // so we trust the client-side isHost check for now.
        this.session.status = "active";
        const playerCount = this.session.players.length;

        // Shuffle player order randomly for the first round
        const playerIds = this.session.players.map((p) => p.id);
        for (let i = playerIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
        }

        const playerStates: Record<string, ReturnType<typeof createInitialPlayerState>> = {};
        for (const pid of playerIds) {
          playerStates[pid] = createInitialPlayerState(playerCount);
        }

        const roundSpending: Record<string, number> = {};
        for (const pid of playerIds) {
          roundSpending[pid] = 0;
        }

        this.gameState = {
          era: "canal",
          round: 1,
          phase: "actions",
          turnOrder: playerIds,
          activePlayerIndex: 0,
          actionsRemainingForActivePlayer: 1, // first round = 1 action
          roundSpending,
          playerStates,
          history: [],
          _undoStack: [],
        };

        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        this.broadcast(
          JSON.stringify({
            type: "GAME_STATE",
            gameState: this.gameState,
          } satisfies ServerMessage)
        );
        break;
      }

      case "RESET_GAME": {
        if (!this.session) return;
        // Reset session back to lobby, clear game state
        this.session.status = "lobby";
        this.gameState = null;
        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        break;
      }

      case "END_SESSION": {
        if (!this.session) return;
        // Admin ends session — notify all clients
        this.session.status = "finished";
        this.gameState = null;
        this.broadcast(
          JSON.stringify({ type: "SESSION_ENDED" } satisfies ServerMessage)
        );
        this.session = null;
        break;
      }

      case "GAME_ACTION": {
        if (!this.gameState) return;
        this.gameState = brassReducer(this.gameState, msg.action);
        this.broadcast(
          JSON.stringify({
            type: "GAME_STATE",
            gameState: this.gameState,
          } satisfies ServerMessage)
        );
        break;
      }
    }
  }

  onClose(conn: Party.Connection) {
    if (this.session) {
      const player = this.session.players.find((p) => p.id === conn.id);
      if (player) {
        player.connected = false;
      }
      this.broadcast(
        JSON.stringify({
          type: "SESSION_UPDATED",
          session: this.session,
        } satisfies ServerMessage)
      );
    }
  }

  private broadcast(message: string) {
    for (const conn of this.room.getConnections()) {
      conn.send(message);
    }
  }
}

BrassBirminghamServer satisfies Party.Worker;
