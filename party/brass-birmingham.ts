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

/** Sessions older than this are automatically cleared on rehydrate. */
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// Storage is sharded across 3 keys (128 KB each):
//   "session"  — session metadata + createdAt + undoChunkCount  (~2 KB)
//   "game"     — game state + history, NO undo stack            (~15 KB)
//   "undo-0", "undo-1", ... — auto-sharded undo snapshots      (~100 KB each)
// No hard limit on total undos — keys are created as needed.
const UNDO_CHUNK = 25;  // snapshots per key (~100 KB, safely under 128 KB)
const PERSIST_HISTORY = 100;

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
  /** Timestamp when this session was created (persisted alongside session). */
  private createdAt: number = 0;

  constructor(readonly room: Party.Room) {}

  /* ------------------------------------------------------------------ */
  /*  Storage — auto-sharded across multiple keys                       */
  /*    "session" — session metadata + createdAt                        */
  /*    "game"    — core game state + history (no undo)                 */
  /*    "undo-0", "undo-1", ... — 25 snapshots per key (~100 KB each)  */
  /* ------------------------------------------------------------------ */

  /** Restore state from durable storage on first connect after hibernation. */
  private async rehydrate() {
    if (this.session) return; // already loaded

    const sessionData = await this.room.storage.get<{
      session: Session;
      createdAt: number;
    }>("session");

    if (!sessionData) return;

    // Check TTL — auto-clear sessions older than 4 hours
    if (Date.now() - (sessionData.createdAt ?? 0) > SESSION_TTL_MS) {
      await this.clearStorage();
      return;
    }

    this.session = sessionData.session;
    this.createdAt = sessionData.createdAt ?? Date.now();

    // Load game state + discover all undo chunks via prefix scan
    const [gameData, undoEntries] = await Promise.all([
      this.room.storage.get<BrassGameState>("game"),
      this.room.storage.list<unknown[]>({ prefix: "undo-" }),
    ]);

    if (gameData) {
      // Reassemble undo stack from all chunks in key order (undo-0, undo-1, ...)
      const undoStack: unknown[] = [];
      const sortedKeys = [...undoEntries.keys()].sort((a, b) => {
        const numA = parseInt(a.split("-")[1]);
        const numB = parseInt(b.split("-")[1]);
        return numA - numB;
      });
      for (const key of sortedKeys) {
        const chunk = undoEntries.get(key);
        if (chunk) undoStack.push(...chunk);
      }
      this.gameState = {
        ...gameData,
        _undoStack: undoStack as BrassGameState["_undoStack"],
      };
    }
  }

  /** Persist current state to durable storage (atomic batch writes). */
  private async persist() {
    try {
      if (!this.session) {
        await this.clearStorage();
        return;
      }

      if (this.gameState) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _undoStack, history, ...coreState } = this.gameState;

        // Strip history from each undo snapshot to save space
        const leanSnapshots = (_undoStack ?? []).map((snap) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { history: _h, _undoStack: _u, ...s } = snap as Record<string, unknown>;
          return s;
        });

        // Auto-shard undo into chunks of 25 per key (~100 KB each)
        const entries: Record<string, unknown> = {
          session: {
            session: this.session,
            createdAt: this.createdAt || Date.now(),
          },
          game: {
            ...coreState,
            history: (history ?? []).slice(-PERSIST_HISTORY),
          },
        };
        let newChunkCount = 0;
        for (let i = 0; i < leanSnapshots.length; i += UNDO_CHUNK) {
          entries[`undo-${newChunkCount}`] = leanSnapshots.slice(i, i + UNDO_CHUNK);
          newChunkCount++;
        }

        // Atomic batch write — all-or-nothing
        await this.room.storage.put(entries);

        // Clean up stale undo keys that are no longer needed
        const existing = await this.room.storage.list({ prefix: "undo-" });
        const staleKeys = [...existing.keys()].filter(
          (k) => parseInt(k.split("-")[1]) >= newChunkCount
        );
        if (staleKeys.length > 0) {
          await this.room.storage.delete(staleKeys);
        }
      } else {
        // No game state — keep session, clear game + all undo keys
        await this.room.storage.put("session", {
          session: this.session,
          createdAt: this.createdAt || Date.now(),
        });
        const undoKeys = await this.room.storage.list({ prefix: "undo-" });
        const keysToDelete = ["game", ...undoKeys.keys()];
        if (keysToDelete.length > 0) {
          await this.room.storage.delete(keysToDelete);
        }
      }
    } catch (err) {
      console.error("[persist] storage error:", err);
    }
  }

  /** Wipe all storage keys. */
  private async clearStorage() {
    const undoKeys = await this.room.storage.list({ prefix: "undo-" });
    const allKeys = ["session", "game", "state", "undo", ...undoKeys.keys()];
    await this.room.storage.delete(allKeys);
  }

  /* ------------------------------------------------------------------ */
  /*  Broadcast helper — strips undo stack from payload                 */
  /* ------------------------------------------------------------------ */

  /** Game state without undo stack, safe to broadcast to clients. */
  private broadcastGameState(): BrassGameState | null {
    if (!this.gameState) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _undoStack, ...rest } = this.gameState;
    return rest as BrassGameState;
  }

  private broadcast(message: string) {
    for (const conn of this.room.getConnections()) {
      conn.send(message);
    }
  }

  private sendGameState(target: Party.Connection | "all") {
    const state = this.broadcastGameState();
    if (!state) return;
    const payload = JSON.stringify({
      type: "GAME_STATE",
      gameState: state,
    } satisfies ServerMessage);
    if (target === "all") {
      this.broadcast(payload);
    } else {
      target.send(payload);
    }
  }

  private sendSession(target: Party.Connection | "all") {
    if (!this.session) return;
    const payload = JSON.stringify({
      type: "SESSION_UPDATED",
      session: this.session,
    } satisfies ServerMessage);
    if (target === "all") {
      this.broadcast(payload);
    } else {
      target.send(payload);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Connection lifecycle                                              */
  /* ------------------------------------------------------------------ */

  async onConnect(conn: Party.Connection) {
    await this.rehydrate();
    this.sendSession(conn);
    this.sendGameState(conn);
  }

  async onClose(conn: Party.Connection) {
    await this.rehydrate();
    if (this.session) {
      const player = this.session.players.find((p) => p.id === conn.id);
      if (player) {
        player.connected = false;
      }
      this.sendSession("all");
      await this.persist();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Message handling                                                  */
  /* ------------------------------------------------------------------ */

  async onMessage(message: string, sender: Party.Connection) {
    await this.rehydrate();

    const msg = JSON.parse(message) as ClientMessage;

    switch (msg.type) {
      case "CREATE_SESSION": {
        // Reconnect path — session already exists
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
          this.sendGameState(sender);
          this.sendSession("all");
          await this.persist();
          break;
        }

        // Fresh session
        this.createdAt = Date.now();
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

        // Reconnecting player
        const existingPlayer = this.session.players.find(
          (p) => p.id === msg.player.id
        );
        if (existingPlayer) {
          existingPlayer.connected = true;
          existingPlayer.name = msg.player.name;
          this.sendSession("all");
          this.sendGameState(sender);
          await this.persist();
          break;
        }

        // New player — lobby only
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
        this.sendSession("all");
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
        this.sendSession("all");
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
        this.sendSession("all");
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

        this.sendSession("all");
        this.sendGameState("all");
        await this.persist();
        break;
      }

      case "RESET_GAME": {
        if (!this.session) return;
        this.session.status = "lobby";
        this.gameState = null;
        this.sendSession("all");
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
        await this.clearStorage();
        break;
      }

      case "GAME_ACTION": {
        if (!this.gameState) return;
        this.gameState = brassReducer(this.gameState, msg.action);
        this.sendGameState("all");
        await this.persist();
        break;
      }
    }
  }
}

BrassBirminghamServer satisfies Party.Worker;
