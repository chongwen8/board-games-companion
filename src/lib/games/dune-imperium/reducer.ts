import { produce } from "immer";
import { FACTIONS } from "./constants";
import { resolveAllianceHolder, getThresholdRewards, getThresholdPenalties, applyReward } from "./logic";
import type {
  DuneAction,
  DuneGameState,
  DuneGameStateSnapshot,
  FactionId,
} from "./types";

const MAX_HISTORY = 100;
const MAX_UNDO_STACK = 300;

/** Strip the undo stack from state to create a lightweight snapshot. */
function snapshot(state: DuneGameState): DuneGameStateSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _undoStack, ...rest } = state;
  return structuredClone(rest);
}

/**
 * Pure reducer for Dune: Imperium game state.
 * Runs on both server (authoritative) and client (optimistic).
 */
export function duneReducer(
  state: DuneGameState,
  action: DuneAction
): DuneGameState {
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

    // Initialize history if missing
    if (!draft.history) draft.history = [];

    // Record action in history
    draft.history.push({ action, timestamp: Date.now() });
    if (draft.history.length > MAX_HISTORY) {
      draft.history = draft.history.slice(-MAX_HISTORY);
    }

    switch (action.type) {
      case "ADJUST_SPICE": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.spice = Math.max(0, ps.spice + action.delta);
        }
        break;
      }

      case "ADJUST_SOLARI": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.solari = Math.max(0, ps.solari + action.delta);
        }
        break;
      }

      case "ADJUST_WATER": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.water = Math.max(0, ps.water + action.delta);
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

      case "ADJUST_INTRIGUE": {
        const ps = draft.playerStates[action.playerId];
        if (ps) {
          ps.intrigue = Math.max(0, ps.intrigue + action.delta);
        }
        break;
      }

      case "ADJUST_INFLUENCE": {
        const ps = draft.playerStates[action.playerId];
        if (!ps) break;

        const faction = action.faction as FactionId;
        const def = FACTIONS[faction];
        if (!def) break;

        const factionState = ps.factions[faction];
        if (!factionState) break;

        const oldLevel = factionState.level;
        const newLevel = Math.max(0, Math.min(def.maxInfluence, oldLevel + action.delta));
        factionState.level = newLevel;

        // --- Threshold rewards (gaining influence) ---
        if (newLevel > oldLevel) {
          const rewards = getThresholdRewards(faction, oldLevel, newLevel);
          for (const reward of rewards) {
            applyReward(ps, reward);
          }
        }

        // --- Threshold penalties (losing influence below VP thresholds) ---
        if (newLevel < oldLevel) {
          const penalties = getThresholdPenalties(faction, oldLevel, newLevel);
          for (const penalty of penalties) {
            applyReward(ps, penalty);
          }
        }

        // --- Alliance resolution ---
        const oldHolder = draft.allianceHolders[faction];
        const newHolder = resolveAllianceHolder(
          faction,
          draft.playerStates,
          oldHolder,
          draft.turnOrder
        );

        if (newHolder !== oldHolder) {
          // Old holder loses alliance
          if (oldHolder && draft.playerStates[oldHolder]) {
            const oldPs = draft.playerStates[oldHolder];
            oldPs.factions[faction].hasAlliance = false;
            oldPs.vp = Math.max(0, oldPs.vp - def.allianceReward.vpGain);
          }

          // New holder gains alliance
          if (newHolder && draft.playerStates[newHolder]) {
            const newPs = draft.playerStates[newHolder];
            newPs.factions[faction].hasAlliance = true;
            newPs.vp += def.allianceReward.vpGain;
            applyReward(newPs, def.allianceReward.bonus);
          }

          draft.allianceHolders[faction] = newHolder;
        }

        break;
      }

      case "NEXT_ROUND": {
        draft.round += 1;
        draft.activePlayerIndex = 0;
        break;
      }

      case "END_GAME": {
        draft.phase = "game-over";
        break;
      }
    }
  });
}
