import type { GameDefinition } from "./types";

export const GAMES: Record<string, GameDefinition> = {
  "brass-birmingham": {
    slug: "brass-birmingham",
    name: "Brass: Birmingham",
    minPlayers: 2,
    maxPlayers: 4,
    description:
      "Track spending, turn order, and industry during your Brass: Birmingham session.",
  },
  "dune-imperium": {
    slug: "dune-imperium",
    name: "Dune: Imperium",
    minPlayers: 2,
    maxPlayers: 4,
    description:
      "Track resources, faction influence, and alliances during your Dune: Imperium session.",
  },
};

export function getGame(slug: string): GameDefinition | undefined {
  return GAMES[slug];
}
