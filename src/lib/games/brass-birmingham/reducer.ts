import { produce } from "immer";
import { calculateTurnOrder, getActionsForRound, getIncomePayout } from "./logic";
import {
  INDUSTRY_TILE_LEVELS,
  LOAN_AMOUNT,
  applyLoanToSpace,
  canDevelopTile,
} from "./constants";
import type {
  BrassAction,
  BrassGameState,
  BrassGameStateSnapshot,
  IndustryType,
} from "./types";

const MAX_HISTORY = 100;
const MAX_UNDO_STACK = 50;

/** Strip the undo stack from state to create a lightweight snapshot. */
function snapshot(state: BrassGameState): BrassGameStateSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _undoStack, ...rest } = state;
  return structuredClone(rest);
}

/**
 * Pure reducer for Brass: Birmingham game state.
 * Runs on both server (authoritative) and client (optimistic).
 */
export function brassReducer(
  state: BrassGameState,
  action: BrassAction
): BrassGameState {
  // UNDO: restore previous state snapshot
  if (action.type === "UNDO") {
    const stack = state._undoStack ?? [];
    if (stack.length === 0) return state;

    const prev = stack[stack.length - 1];
    return {
      ...prev,
      _undoStack: stack.slice(0, -1),
    };
  }

  // Save snapshot of current state before applying action
  const prevSnapshot = snapshot(state);

  return produce(state, (draft) => {
    // Push snapshot onto undo stack
    if (!draft._undoStack) draft._undoStack = [];
    draft._undoStack.push(prevSnapshot);
    if (draft._undoStack.length > MAX_UNDO_STACK) {
      draft._undoStack = draft._undoStack.slice(-MAX_UNDO_STACK);
    }

    // Initialize history if missing (backwards compat)
    if (!draft.history) draft.history = [];

    // Record action in history
    draft.history.push({ action, timestamp: Date.now() });
    if (draft.history.length > MAX_HISTORY) {
      draft.history = draft.history.slice(-MAX_HISTORY);
    }

    switch (action.type) {
      case "RECORD_SPEND": {
        const current = draft.roundSpending[action.playerId] ?? 0;
        draft.roundSpending[action.playerId] = current + action.amount;
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.money -= action.amount;
        }
        break;
      }

      case "ADJUST_SPEND": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          const oldSpend = draft.roundSpending[action.playerId] ?? 0;
          const diff = action.amount - oldSpend;
          ps.money -= diff;
        }
        draft.roundSpending[action.playerId] = action.amount;
        break;
      }

      case "END_TURN": {
        const totalPlayers = draft.turnOrder.length;
        const currentActions = draft.actionsRemainingForActivePlayer;

        if (currentActions > 1) {
          draft.actionsRemainingForActivePlayer = currentActions - 1;
        } else {
          const nextIndex = draft.activePlayerIndex + 1;
          if (nextIndex < totalPlayers) {
            draft.activePlayerIndex = nextIndex;
            draft.actionsRemainingForActivePlayer = getActionsForRound(
              draft.round
            );
          }
        }
        break;
      }

      case "END_ROUND": {
        // 1. Apply income payouts to each player's money
        for (const pid of draft.turnOrder) {
          const ps = draft.playerStates[pid];
          if (ps) {
            const payout = getIncomePayout(ps.income);
            ps.money += payout; // can be negative
          }
        }

        // 2. Recalculate turn order based on spending
        const newOrder = calculateTurnOrder(
          draft.roundSpending,
          draft.turnOrder
        );
        draft.turnOrder = newOrder;

        // 3. Reset spending for next round
        for (const pid of draft.turnOrder) {
          draft.roundSpending[pid] = 0;
        }

        // 4. Advance round
        draft.round += 1;
        draft.activePlayerIndex = 0;
        draft.actionsRemainingForActivePlayer = getActionsForRound(draft.round);
        draft.phase = "actions";
        break;
      }

      case "NEXT_ERA": {
        draft.era = "rail";
        draft.round = 1;
        draft.activePlayerIndex = 0;
        draft.actionsRemainingForActivePlayer = 1;
        draft.phase = "actions";
        for (const pid of draft.turnOrder) {
          draft.roundSpending[pid] = 0;
        }
        // Era transition: Level I built tiles are removed from the board.
        // Mark them back as "available" on the player mat.
        for (const pid of draft.turnOrder) {
          const ps = draft.playerStates[pid];
          if (!ps) continue;
          for (const [industry, stack] of Object.entries(ps.industryStacks)) {
            const levels = INDUSTRY_TILE_LEVELS[industry];
            if (!levels) continue;
            for (let i = 0; i < stack.length; i++) {
              if (levels[i] === 1 && stack[i] === "built") {
                stack[i] = "available";
              }
            }
          }
        }
        break;
      }

      case "TAKE_LOAN": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.money += LOAN_AMOUNT;
          ps.income = applyLoanToSpace(ps.income); // drops 3 income levels
          ps.loans += 1;
        }
        break;
      }

      case "ADJUST_INCOME": {
        // +/- adjusts the track SPACE by delta (not income level)
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.income = Math.max(0, Math.min(99, ps.income + action.delta));
        }
        break;
      }

      case "ADJUST_VP": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.vp = Math.max(0, ps.vp + action.delta);
        }
        break;
      }

      case "ADJUST_MONEY": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.money += action.delta;
        }
        break;
      }

      case "BUILD_TILE": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          const stack = ps.industryStacks[action.industry];
          if (stack && stack[action.index] === "available") {
            stack[action.index] = "built";
          }
        }
        break;
      }

      case "DEVELOP_TILE": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          const stack = ps.industryStacks[action.industry];
          if (stack && stack[action.index] === "available") {
            stack[action.index] = "developed";
          }
        }
        break;
      }

      case "CYCLE_TILE": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          const stack = ps.industryStacks[action.industry];
          if (stack && action.index >= 0 && action.index < stack.length) {
            const current = stack[action.index];
            const developable = canDevelopTile(action.industry, action.index);
            if (current === "available") {
              stack[action.index] = "built";
            } else if (current === "built") {
              // Only cycle to "developed" if this specific tile is developable
              stack[action.index] = developable ? "developed" : "available";
            } else if (current === "developed") {
              stack[action.index] = "available";
            }
          }
        }
        break;
      }

      case "END_GAME": {
        draft.phase = "game-over";
        break;
      }
    }
  });
}
