import type { FactionId, DunePlayerState } from "./types";
import { FACTIONS, MAX_SPY, TROOP_STRENGTH, DREADNOUGHT_STRENGTH } from "./constants";
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
  turnOrder: string[],
  factions = FACTIONS
): string | null {
  const def = factions[faction];
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
  newLevel: number,
  factions = FACTIONS
): FactionReward[] {
  const def = factions[faction];
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
  newLevel: number,
  factions = FACTIONS
): FactionReward[] {
  const def = factions[faction];
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
    case "spy":
      if (ps.spy !== undefined) {
        ps.spy = Math.max(0, Math.min(MAX_SPY, ps.spy + reward.amount));
      }
      break;
  }
}

// --- Combat ---

export interface CombatResult {
  playerId: string;
  troops: number;
  bonus: number;
  strength: number;
}

/** Calculate combat strength: troops × 2 + bonus (dreadnoughts, sandworms, cards, etc.) */
export function getCombatStrength(ps: DunePlayerState): number {
  return (ps.combat ?? 0) * TROOP_STRENGTH + (ps.combatBonus ?? 0);
}

/** Rank players by combat strength descending. Only includes players with strength > 0. */
export function rankCombatResults(
  playerStates: Record<string, DunePlayerState>,
  turnOrder: string[]
): CombatResult[] {
  return turnOrder
    .map((playerId) => {
      const ps = playerStates[playerId];
      if (!ps) return null;
      return {
        playerId,
        troops: ps.combat ?? 0,
        bonus: ps.combatBonus ?? 0,
        strength: getCombatStrength(ps),
      };
    })
    .filter((r): r is CombatResult => r !== null && r.strength > 0)
    .sort((a, b) => b.strength - a.strength);
}

/** Check if any player has troops or bonus committed to combat. */
export function hasCombatParticipants(
  playerStates: Record<string, DunePlayerState>,
  turnOrder: string[]
): boolean {
  return turnOrder.some((pid) => {
    const ps = playerStates[pid];
    return ps && ((ps.combat ?? 0) > 0 || (ps.combatBonus ?? 0) > 0);
  });
}
