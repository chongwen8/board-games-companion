// --- Shared across all games ---

export type PlayerColor = "red" | "yellow" | "green" | "purple";

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  seatOrder: number;
  connected: boolean;
}

export interface Session {
  id: string;
  code: string; // 4-char join code, e.g. "XKRM"
  gameSlug: string;
  hostPlayerId: string;
  players: Player[];
  status: "lobby" | "active" | "finished";
}

export interface GameDefinition {
  slug: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
}
