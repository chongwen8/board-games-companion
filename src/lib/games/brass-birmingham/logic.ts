import {
  LOAN_AMOUNT,
  ROUNDS_PER_ERA,
  spaceToIncome,
  applyLoanToSpace,
} from "./constants";
import type { BrassGameState, BrassPlayerState } from "./types";

/**
 * Calculate turn order for the next round.
 * Least spent goes first; ties broken by previous turn order.
 */
export function calculateTurnOrder(
  roundSpending: Record<string, number>,
  previousTurnOrder: string[]
): string[] {
  return [...previousTurnOrder].sort((a, b) => {
    const diff = (roundSpending[a] ?? 0) - (roundSpending[b] ?? 0);
    if (diff !== 0) return diff;
    return previousTurnOrder.indexOf(a) - previousTurnOrder.indexOf(b);
  });
}

/**
 * Get the income payout (£ per round) for a given track space.
 * `income` field in BrassPlayerState = track space (0–99).
 */
export function getIncomePayout(trackSpace: number): number {
  return spaceToIncome(trackSpace);
}

/**
 * Apply a loan: +£30, drop 3 income levels (not spaces).
 */
export function applyLoan(player: BrassPlayerState): BrassPlayerState {
  return {
    ...player,
    money: player.money + LOAN_AMOUNT,
    income: applyLoanToSpace(player.income),
    loans: player.loans + 1,
  };
}

/**
 * Get total rounds for the current era and player count.
 */
export function getTotalRounds(playerCount: number): number {
  return ROUNDS_PER_ERA[playerCount] ?? 8;
}

/**
 * Determine actions per player for the current round.
 * First round of each era: 1 action. All others: 2.
 */
export function getActionsForRound(round: number): number {
  return round === 1 ? 1 : 2;
}

/**
 * Check if the current round is the last of the era.
 */
export function isLastRoundOfEra(
  state: BrassGameState,
  playerCount: number
): boolean {
  return state.round >= getTotalRounds(playerCount);
}
