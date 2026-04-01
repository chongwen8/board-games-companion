import type * as Party from "partykit/server";
import { BaseGameServer } from "./shared/base-game-server";
import { duneReducer } from "../src/lib/games/dune-imperium/reducer";
import { FACTION_IDS, STARTING_RESOURCES, getStartingVp } from "../src/lib/games/dune-imperium/constants";
import type { DuneGameState, DunePlayerState, FactionId } from "../src/lib/games/dune-imperium/types";

function createInitialPlayerState(playerCount: number): DunePlayerState {
  const factions = {} as Record<FactionId, { level: number; hasAlliance: boolean }>;
  for (const fid of FACTION_IDS) {
    factions[fid] = { level: 0, hasAlliance: false };
  }
  return {
    spice: STARTING_RESOURCES.spice,
    solari: STARTING_RESOURCES.solari,
    water: STARTING_RESOURCES.water,
    vp: getStartingVp(playerCount),
    intrigue: 0,
    factions,
  };
}

export default class DuneImperiumServer extends BaseGameServer {
  gameSlug = "dune-imperium";

  createInitialGameState(playerIds: string[]): DuneGameState {
    const playerCount = playerIds.length;
    const playerStates: Record<string, DunePlayerState> = {};
    for (const pid of playerIds) {
      playerStates[pid] = createInitialPlayerState(playerCount);
    }

    const allianceHolders = {} as Record<FactionId, string | null>;
    for (const fid of FACTION_IDS) {
      allianceHolders[fid] = null;
    }

    return {
      round: 1,
      phase: "playing",
      turnOrder: playerIds,
      activePlayerIndex: 0,
      playerStates,
      allianceHolders,
      history: [],
      _undoStack: [],
    };
  }

  applyAction(state: DuneGameState, action: unknown): DuneGameState {
    return duneReducer(state, action as Parameters<typeof duneReducer>[1]);
  }

  stripUndoStack(state: DuneGameState): DuneGameState {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _undoStack, ...rest } = state;
    return rest as DuneGameState;
  }
}

DuneImperiumServer satisfies Party.Worker;
