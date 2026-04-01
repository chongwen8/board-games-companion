import type * as Party from "partykit/server";
import { BaseGameServer } from "./shared/base-game-server";
import { brassReducer } from "../src/lib/games/brass-birmingham/reducer";
import {
  INDUSTRY_TILE_LEVELS,
  STARTING_INCOME_SPACE,
  STARTING_MONEY,
} from "../src/lib/games/brass-birmingham/constants";
import type { BrassGameState, IndustryType, TileStatus } from "../src/lib/games/brass-birmingham/types";

function createInitialPlayerState(playerCount: number): {
  money: number;
  income: number;
  vp: number;
  loans: number;
  industryStacks: Record<IndustryType, TileStatus[]>;
  lockedTiles: Record<IndustryType, boolean[]>;
} {
  const stacks = {} as Record<IndustryType, TileStatus[]>;
  const locked = {} as Record<IndustryType, boolean[]>;
  for (const [industry, tileLevels] of Object.entries(INDUSTRY_TILE_LEVELS)) {
    stacks[industry as IndustryType] = tileLevels.map(() => "available" as TileStatus);
    locked[industry as IndustryType] = tileLevels.map(() => false);
  }
  return {
    money: STARTING_MONEY[playerCount] ?? 17,
    income: STARTING_INCOME_SPACE,
    vp: 0,
    loans: 0,
    industryStacks: stacks,
    lockedTiles: locked,
  };
}

export default class BrassBirminghamServer extends BaseGameServer {
  gameSlug = "brass-birmingham";

  createInitialGameState(playerIds: string[], playerCount: number): BrassGameState {
    const playerStates: Record<string, ReturnType<typeof createInitialPlayerState>> = {};
    for (const pid of playerIds) {
      playerStates[pid] = createInitialPlayerState(playerCount);
    }

    const roundSpending: Record<string, number> = {};
    for (const pid of playerIds) {
      roundSpending[pid] = 0;
    }

    return {
      era: "canal",
      round: 1,
      phase: "actions",
      turnOrder: playerIds,
      activePlayerIndex: 0,
      actionsRemainingForActivePlayer: 1,
      roundSpending,
      playerStates,
      history: [],
      _undoStack: [],
    };
  }

  applyAction(state: BrassGameState, action: unknown): BrassGameState {
    return brassReducer(state, action as Parameters<typeof brassReducer>[1]);
  }

  stripUndoStack(state: BrassGameState): BrassGameState {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _undoStack, ...rest } = state;
    return rest as BrassGameState;
  }
}

BrassBirminghamServer satisfies Party.Worker;
