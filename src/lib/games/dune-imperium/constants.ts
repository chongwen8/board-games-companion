import type { FactionId } from "./types";

// --- Resource types (extensible for Uprising) ---
export type ResourceType = "spice" | "solari" | "water" | "vp" | "intrigue";

export interface FactionReward {
  resource: ResourceType;
  amount: number;
}

export interface FactionThreshold {
  level: number;
  reward: FactionReward;
}

export interface AllianceReward {
  vpGain: number;
  bonus: FactionReward;
}

export interface FactionDefinition {
  id: FactionId;
  name: string;
  nameZh: string;
  maxInfluence: number;
  allianceLevel: number;
  thresholds: FactionThreshold[];
  allianceReward: AllianceReward;
  /** Tailwind color token for UI theming */
  color: string;
}

// --- Base game faction definitions ---
export const BASE_GAME_FACTIONS: Record<FactionId, FactionDefinition> = {
  emperor: {
    id: "emperor",
    name: "Emperor",
    nameZh: "皇帝",
    maxInfluence: 6,
    allianceLevel: 4,
    thresholds: [
      { level: 2, reward: { resource: "vp", amount: 1 } },
      // Level 4: 2 soldiers (not tracked by app)
    ],
    allianceReward: { vpGain: 1, bonus: { resource: "solari", amount: 0 } },
    color: "yellow",
  },
  spacingGuild: {
    id: "spacingGuild",
    name: "Spacing Guild",
    nameZh: "宇航公会",
    maxInfluence: 6,
    allianceLevel: 4,
    thresholds: [
      { level: 2, reward: { resource: "vp", amount: 1 } },
      { level: 4, reward: { resource: "spice", amount: 3 } },
    ],
    allianceReward: { vpGain: 1, bonus: { resource: "solari", amount: 0 } },
    color: "red",
  },
  beneGesserit: {
    id: "beneGesserit",
    name: "Bene Gesserit",
    nameZh: "贝尼·杰瑟里特",
    maxInfluence: 6,
    allianceLevel: 4,
    thresholds: [
      { level: 2, reward: { resource: "vp", amount: 1 } },
      { level: 4, reward: { resource: "intrigue", amount: 1 } },
    ],
    allianceReward: { vpGain: 1, bonus: { resource: "solari", amount: 0 } },
    color: "blue",
  },
  fremen: {
    id: "fremen",
    name: "Fremen",
    nameZh: "弗雷曼人",
    maxInfluence: 6,
    allianceLevel: 4,
    thresholds: [
      { level: 2, reward: { resource: "vp", amount: 1 } },
      { level: 4, reward: { resource: "water", amount: 1 } },
    ],
    allianceReward: { vpGain: 1, bonus: { resource: "water", amount: 0 } },
    color: "teal",
  },
};

// Active faction set — swap this for Uprising expansion
export const FACTIONS = BASE_GAME_FACTIONS;

/** Ordered list of faction IDs for consistent UI rendering */
export const FACTION_IDS: FactionId[] = ["emperor", "spacingGuild", "beneGesserit", "fremen"];

// --- Starting resources ---
export const STARTING_RESOURCES = {
  spice: 0,
  solari: 0,
  water: 1,
};

/** Starting VP depends on player count: 2-3p = 1 VP, 4p = 0 VP */
export function getStartingVp(playerCount: number): number {
  return playerCount >= 4 ? 0 : 1;
}
