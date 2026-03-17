import type * as Party from "partykit/server";

/**
 * Lobby room: maps 4-letter session codes to room IDs.
 * There's exactly one lobby room (ID: "main").
 * Clients send REGISTER_CODE or LOOKUP_CODE messages.
 */

type LobbyClientMessage =
  | { type: "REGISTER_CODE"; code: string; roomId: string }
  | { type: "LOOKUP_CODE"; code: string };

type LobbyServerMessage =
  | { type: "CODE_FOUND"; roomId: string }
  | { type: "CODE_NOT_FOUND"; code: string };

export default class LobbyServer implements Party.Server {
  codeToRoom: Map<string, string> = new Map();

  constructor(readonly room: Party.Room) {}

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as LobbyClientMessage;

    switch (msg.type) {
      case "REGISTER_CODE": {
        this.codeToRoom.set(msg.code, msg.roomId);
        break;
      }
      case "LOOKUP_CODE": {
        const roomId = this.codeToRoom.get(msg.code);
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
