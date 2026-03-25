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
  lockedTiles: Record<IndustryType, boolean[]>;
} {
  const stacks = {} as Record<IndustryType, TileStatus[]>;
  const locked = {} as Record<IndustryType, boolean[]>;
  for (const [industry, tileLevels] of Object.entries(INDUSTRY_TILE_LEVELS)) {
    stacks[industry as IndustryType] = tileLevels.map(() => "available" as TileStatus);
    locked[industry as IndustryType] = tileLevels.map(() => false);
  }
  return {
    money: STARTING_MONEY[playerCount] ?? 17,
    income: STARTING_INCOME_SPACE,
    vp: 0,
    loans: 0,
    industryStacks: stacks,
    lockedTiles: locked,
  };
}

export default class BrassBirminghamServer implements Party.Server {
  session: Session | null = null;
  gameState: BrassGameState | null = null;

  constructor(readonly room: Party.Room) {}

  /** Restore state from durable storage on first connect after hibernation. */
  private async rehydrate() {
    if (this.session) return; // already loaded
    const stored = await this.room.storage.get<{
      session: Session;
      gameState: BrassGameState | null;
    }>("state");
    if (stored) {
      this.session = stored.session;
      this.gameState = stored.gameState;
    }
  }

  /** Persist current state to durable storage. */
  private async persist() {
    if (this.session) {
      await this.room.storage.put("state", {
        session: this.session,
        gameState: this.gameState,
      });
    } else {
      await this.room.storage.delete("state");
    }
  }

  async onConnect(conn: Party.Connection) {
    // Rehydrate from storage if server was hibernated
    await this.rehydrate();

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

  async onMessage(message: string, sender: Party.Connection) {
    // Ensure state is loaded
    await this.rehydrate();

    const msg = JSON.parse(message) as ClientMessage;

    switch (msg.type) {
      case "CREATE_SESSION": {
        // If session already exists (e.g. rehydrated), send it to the client
        // instead of creating a new one — this handles the reconnect-after-refresh case
        if (this.session) {
          const existingPlayer = this.session.players.find(
            (p) => p.id === msg.player.id
          );
          if (existingPlayer) {
            existingPlayer.connected = true;
            existingPlayer.name = msg.player.name;
          }
          sender.send(
            JSON.stringify({
              type: "SESSION_CREATED",
              session: this.session,
            } satisfies ServerMessage)
          );
          if (this.gameState) {
            sender.send(
              JSON.stringify({
                type: "GAME_STATE",
                gameState: this.gameState,
              } satisfies ServerMessage)
            );
          }
          this.broadcast(
            JSON.stringify({
              type: "SESSION_UPDATED",
              session: this.session,
            } satisfies ServerMessage)
          );
          await this.persist();
          break;
        }

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
        await this.persist();
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

        // Allow reconnecting players even if game has already started
        const existingPlayer = this.session.players.find(
          (p) => p.id === msg.player.id
        );

        if (existingPlayer) {
          // Reconnecting player — mark connected and send full state
          existingPlayer.connected = true;
          existingPlayer.name = msg.player.name;
          this.broadcast(
            JSON.stringify({
              type: "SESSION_UPDATED",
              session: this.session,
            } satisfies ServerMessage)
          );
          if (this.gameState) {
            sender.send(
              JSON.stringify({
                type: "GAME_STATE",
                gameState: this.gameState,
              } satisfies ServerMessage)
            );
          }
          await this.persist();
          break;
        }

        // New player joining — only allowed during lobby phase
        if (this.session.status !== "lobby") {
          sender.send(
            JSON.stringify({
              type: "ERROR",
              message: "Game already started",
            } satisfies ServerMessage)
          );
          return;
        }
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
        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        await this.persist();
        break;
      }

      case "ADD_BOT": {
        if (!this.session || this.session.status !== "lobby") return;
        if (this.session.players.length >= 4) return;
        const botColors = ["red", "yellow", "green", "purple"] as const;
        const usedBotColors = new Set(this.session.players.map((p) => p.color));
        const nextBotColor = botColors.find((c) => !usedBotColors.has(c)) ?? "red";
        const botIndex = this.session.players.filter((p) =>
          p.id.startsWith("bot-")
        ).length;
        const botId = `bot-${crypto.randomUUID().slice(0, 8)}`;
        this.session.players.push({
          id: botId,
          name: BOT_NAMES[botIndex] ?? `Bot ${botIndex + 1}`,
          color: nextBotColor,
          seatOrder: this.session.players.length,
          connected: true,
        });
        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        await this.persist();
        break;
      }

      case "REMOVE_BOT": {
        if (!this.session || this.session.status !== "lobby") return;
        this.session.players = this.session.players.filter(
          (p) => p.id !== msg.botId
        );
        this.session.players.forEach((p, i) => {
          p.seatOrder = i;
        });
        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        await this.persist();
        break;
      }

      case "START_GAME": {
        if (!this.session) return;
        this.session.status = "active";
        const playerCount = this.session.players.length;

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
          actionsRemainingForActivePlayer: 1,
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
        await this.persist();
        break;
      }

      case "RESET_GAME": {
        if (!this.session) return;
        this.session.status = "lobby";
        this.gameState = null;
        this.broadcast(
          JSON.stringify({
            type: "SESSION_UPDATED",
            session: this.session,
          } satisfies ServerMessage)
        );
        await this.persist();
        break;
      }

      case "END_SESSION": {
        if (!this.session) return;
        this.session.status = "finished";
        this.gameState = null;
        this.broadcast(
          JSON.stringify({ type: "SESSION_ENDED" } satisfies ServerMessage)
        );
        this.session = null;
        await this.persist(); // clears storage
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
        await this.persist();
        break;
      }
    }
  }

  async onClose(conn: Party.Connection) {
    await this.rehydrate();
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
      await this.persist();
    }
  }

  private broadcast(message: string) {
    for (const conn of this.room.getConnections()) {
      conn.send(message);
    }
  }
}

BrassBirminghamServer satisfies Party.Worker;
