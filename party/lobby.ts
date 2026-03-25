import type * as Party from "partykit/server";

/**
 * Lobby room: maps 4-letter session codes to room IDs.
 * There's exactly one lobby room (ID: "main").
 * Uses room.storage for durable persistence across hibernation.
 */

type LobbyClientMessage =
  | { type: "REGISTER_CODE"; code: string; roomId: string }
  | { type: "LOOKUP_CODE"; code: string };

type LobbyServerMessage =
  | { type: "CODE_FOUND"; roomId: string }
  | { type: "CODE_NOT_FOUND"; code: string };

export default class LobbyServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as LobbyClientMessage;

    switch (msg.type) {
      case "REGISTER_CODE": {
        await this.room.storage.put(`code:${msg.code}`, msg.roomId);
        break;
      }
      case "LOOKUP_CODE": {
        const roomId = await this.room.storage.get<string>(`code:${msg.code}`);
        if (roomId) {
          sender.send(
            JSON.stringify({
              type: "CODE_FOUND",
              roomId,
            } satisfies LobbyServerMessage)
          );
        } else {
          sender.send(
            JSON.stringify({
              type: "CODE_NOT_FOUND",
              code: msg.code,
            } satisfies LobbyServerMessage)
          );
        }
        break;
      }
    }
  }
}

LobbyServer satisfies Party.Worker;
