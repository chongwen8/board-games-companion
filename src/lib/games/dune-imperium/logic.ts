import type { FactionId, DunePlayerState } from "./types";
import { FACTIONS } from "./constants";
import type { FactionReward } from "./constants";

/**
 * Determine who should hold the alliance token for a given faction.
 *
 * Rules:
 * - The player with the highest influence >= allianceLevel holds the alliance.
 * - On ties, the incumbent (currentHolder) retains the alliance.
 * - If no incumbent is tied, the first player in turn order wins.
 * - Returns null if no player qualifies.
 */
export function resolveAllianceHolder(
  faction: FactionId,
  playerStates: Record<string, DunePlayerState>,
  currentHolder: string | null,
  turnOrder: string[]
): string | null {
  const def = FACTIONS[faction];
  if (!def) return null;

  let bestPid: string | null = null;
  let bestLevel = def.allianceLevel - 1; // must be >= allianceLevel

  for (const pid of turnOrder) {
    const ps = playerStates[pid];
    if (!ps) continue;
    const level = ps.factions[faction]?.level ?? 0;

    if (level >= def.allianceLevel) {
      if (level > bestLevel) {
        bestLevel = level;
        bestPid = pid;
      } else if (level === bestLevel) {
        // Tie: incumbent keeps it
        if (pid === currentHolder) {
          bestPid = pid;
        }
        // If bestPid is already set and neither is incumbent, first in turn order wins
        // (already handled by iteration order)
      }
    }
  }

  return bestPid;
}

/**
 * Get threshold rewards earned when crossing from oldLevel to newLevel.
 * Only returns rewards for levels crossed upward.
 */
export function getThresholdRewards(
  faction: FactionId,
  oldLevel: number,
  newLevel: number
): FactionReward[] {
  const def = FACTIONS[faction];
  if (!def || newLevel <= oldLevel) return [];

  return def.thresholds
    .filter((t) => t.level > oldLevel && t.level <= newLevel)
    .map((t) => t.reward);
}

/**
 * Get threshold penalties when dropping from oldLevel to newLevel.
 * Returns rewards with negative amounts for thresholds crossed downward.
 * Only applies to VP thresholds (resource thresholds are not clawed back).
 */
export function getThresholdPenalties(
  faction: FactionId,
  oldLevel: number,
  newLevel: number
): FactionReward[] {
  const def = FACTIONS[faction];
  if (!def || newLevel >= oldLevel) return [];

  return def.thresholds
    .filter((t) => t.level <= oldLevel && t.level > newLevel && t.reward.resource === "vp")
    .map((t) => ({ resource: t.reward.resource, amount: -t.reward.amount }));
}

/**
 * Apply a resource reward to a player state (mutates in place for use with Immer).
 */
export function applyReward(ps: DunePlayerState, reward: FactionReward): void {
  switch (reward.resource) {
    case "spice":
      ps.spice += reward.amount;
      break;
    case "solari":
      ps.solari += reward.amount;
      break;
    case "water":
      ps.water += reward.amount;
      break;
    case "vp":
      ps.vp = Math.max(0, ps.vp + reward.amount);
      break;
    case "intrigue":
      ps.intrigue = Math.max(0, ps.intrigue + reward.amount);
      break;
  }
}
