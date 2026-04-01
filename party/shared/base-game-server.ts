import type * as Party from "partykit/server";
import type { Session } from "../../src/lib/games/types";
import { generateSessionCode } from "../../src/lib/utils/session-code";

const BOT_NAMES = ["Alice (bot)", "Bob (bot)", "Carol (bot)"];

/** Sessions older than this are automatically cleared on rehydrate. */
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// Storage is sharded across multiple keys (128 KB each):
//   "session"  — session metadata + createdAt                     (~2 KB)
//   "game"     — game state + history, NO undo stack              (~15 KB)
//   "undo-0", "undo-1", ... — auto-sharded undo snapshots         (~100 KB each)
const UNDO_CHUNK = 25;  // snapshots per key (~100 KB, safely under 128 KB)
const PERSIST_HISTORY = 100;

interface ClientMessageBase {
  type: string;
  player?: { id: string; name: string };
  code?: string;
  botId?: string;
  playerCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action?: any;
}

interface ServerMessage {
  type: string;
  session?: Session;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameState?: any;
  message?: string;
}

/**
 * Base class for PartyKit game servers.
 * Handles session management, storage sharding, connection lifecycle,
 * and broadcast helpers. Game-specific servers extend this class.
 */
export abstract class BaseGameServer implements Party.Server {
  abstract gameSlug: string;

  /** Create the initial game state for a new game. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract createInitialGameState(playerIds: string[], playerCount: number): any;

  /** Apply a game action to the current state, returning the new state. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract applyAction(state: any, action: any): any;

  /** Strip the undo stack from game state for broadcasting to clients. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract stripUndoStack(state: any): any;

  session: Session | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameState: any = null;
  private createdAt: number = 0;

  constructor(readonly room: Party.Room) {}

  /* ------------------------------------------------------------------ */
  /*  Storage — auto-sharded across multiple keys                       */
  /* ------------------------------------------------------------------ */

  private async rehydrate() {
    if (this.session) return;

    const sessionData = await this.room.storage.get<{
      session: Session;
      createdAt: number;
    }>("session");

    if (!sessionData) return;

    if (Date.now() - (sessionData.createdAt ?? 0) > SESSION_TTL_MS) {
      await this.clearStorage();
      return;
    }

    this.session = sessionData.session;
    this.createdAt = sessionData.createdAt ?? Date.now();

    const [gameData, undoEntries] = await Promise.all([
      this.room.storage.get<Record<string, unknown>>("game"),
      this.room.storage.list<unknown[]>({ prefix: "undo-" }),
    ]);

    if (gameData) {
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
        _undoStack: undoStack,
      };
    }
  }

  private async persist() {
    try {
      if (!this.session) {
        await this.clearStorage();
        return;
      }

      if (this.gameState) {
        const { _undoStack, history, ...coreState } = this.gameState;

        const leanSnapshots = (_undoStack ?? []).map((snap: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { history: _h, _undoStack: _u, ...s } = snap;
          return s;
        });

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

        await this.room.storage.put(entries);

        const existing = await this.room.storage.list({ prefix: "undo-" });
        const staleKeys = [...existing.keys()].filter(
          (k) => parseInt(k.split("-")[1]) >= newChunkCount
        );
        if (staleKeys.length > 0) {
          await this.room.storage.delete(staleKeys);
        }
      } else {
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

  private async clearStorage() {
    const undoKeys = await this.room.storage.list({ prefix: "undo-" });
    const allKeys = ["session", "game", "state", "undo", ...undoKeys.keys()];
    await this.room.storage.delete(allKeys);
  }

  /* ------------------------------------------------------------------ */
  /*  Broadcast helpers                                                 */
  /* ------------------------------------------------------------------ */

  private broadcastGameState() {
    if (!this.gameState) return null;
    return this.stripUndoStack(this.gameState);
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

    const msg = JSON.parse(message) as ClientMessageBase;

    switch (msg.type) {
      case "CREATE_SESSION": {
        if (this.session) {
          const existingPlayer = this.session.players.find(
            (p) => p.id === msg.player!.id
          );
          if (existingPlayer) {
            existingPlayer.connected = true;
            existingPlayer.name = msg.player!.name;
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

        this.createdAt = Date.now();
        this.session = {
          id: this.room.id,
          code: generateSessionCode(),
          gameSlug: this.gameSlug,
          hostPlayerId: msg.player!.id,
          players: [
            {
              id: msg.player!.id,
              name: msg.player!.name,
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

        const existingPlayer = this.session.players.find(
          (p) => p.id === msg.player!.id
        );
        if (existingPlayer) {
          existingPlayer.connected = true;
          existingPlayer.name = msg.player!.name;
          this.sendSession("all");
          this.sendGameState(sender);
          await this.persist();
          break;
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
        const nextColor = colors.find((c) => !usedColors.has(c)) ?? "red";
        this.session.players.push({
          id: msg.player!.id,
          name: msg.player!.name,
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

        this.gameState = this.createInitialGameState(playerIds, playerCount);

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
        this.gameState = this.applyAction(this.gameState, msg.action);
        this.sendGameState("all");
        await this.persist();
        break;
      }
    }
  }
}
