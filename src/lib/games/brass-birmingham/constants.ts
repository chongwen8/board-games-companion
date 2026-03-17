/**
 * Brass: Birmingham game constants.
 *
 * Rounds per era by player count.
 * Income track mapping level → payout.
 * Starting money and income by player count.
 * Tile definitions per industry.
 */

/** Rounds per era indexed by player count (2-4). */
export const ROUNDS_PER_ERA: Record<number, number> = {
  2: 10,
  3: 9,
  4: 8,
};

/** Starting money per player count. */
export const STARTING_MONEY: Record<number, number> = {
  2: 30,
  3: 30,
  4: 30,
};

/**
 * Starting income track space for all players.
 * Space 10 = income level 0 = £0 per round.
 */
export const STARTING_INCOME_SPACE = 10;

/** Loan: gain £30, lose 3 income LEVELS (not spaces). */
export const LOAN_AMOUNT = 30;
export const LOAN_INCOME_LEVEL_PENALTY = 3;

/**
 * Income track: the board has spaces 0-99.
 * Each space maps to an income level (= £ received per round).
 * The mapping is non-linear: denser at higher incomes.
 *
 * Spaces 0-10:  1 space per level  (income -10 to 0)
 * Spaces 11-30: 2 spaces per level (income 1 to 10)
 * Spaces 31-60: 3 spaces per level (income 11 to 20)
 * Spaces 61-99: 4 spaces per level (income 21 to 30)
 */

/** Convert a track space (0-99) to income level (= £ per round). */
export function spaceToIncome(space: number): number {
  const s = Math.max(0, Math.min(99, space));
  if (s <= 10) return s - 10;                       // 0→-10 … 10→0
  if (s <= 30) return Math.floor((s - 11) / 2) + 1; // 11-12→1 … 29-30→10
  if (s <= 60) return Math.floor((s - 31) / 3) + 11; // 31-33→11 … 58-60→20
  return Math.floor((s - 61) / 4) + 21;              // 61-64→21 … 97-99→30
}

/** Convert an income level (-10 to 30) to the first track space at that level. */
export function incomeToSpace(income: number): number {
  const i = Math.max(-10, Math.min(30, income));
  if (i <= 0) return i + 10;                   // -10→0 … 0→10
  if (i <= 10) return (i - 1) * 2 + 11;        // 1→11, 2→13, … 10→29
  if (i <= 20) return (i - 11) * 3 + 31;       // 11→31, 12→34, … 20→58
  return (i - 21) * 4 + 61;                    // 21→61, 22→65, … 30→97
}

/**
 * Apply a loan: find current income level, drop 3 levels, return new space.
 * Clamps to space 0 (income -10).
 */
export function applyLoanToSpace(currentSpace: number): number {
  const currentIncome = spaceToIncome(currentSpace);
  const newIncome = Math.max(-10, currentIncome - LOAN_INCOME_LEVEL_PENALTY);
  return incomeToSpace(newIncome);
}

/**
 * Tile levels per industry per player, in mat order (top to bottom).
 * Each entry is the level of that tile. Multiple entries with the same
 * level = multiple tiles at that level. Tiles must be built/developed
 * in order — you must exhaust lower tiles before accessing higher ones.
 *
 * Verified against the physical player mat tile sheet.
 *
 * Cotton Mill (11): 3×Lv1, 2×Lv2, 3×Lv3, 3×Lv4
 * Iron Works  (4):  1×Lv1, 1×Lv2, 1×Lv3, 1×Lv4
 * Brewery     (7):  2×Lv1, 2×Lv2, 2×Lv3, 1×Lv4
 * Coal Mine   (7):  1×Lv1, 2×Lv2, 2×Lv3, 2×Lv4
 * Pottery     (5):  1×Lv1, 1×Lv2, 1×Lv3, 1×Lv4, 1×Lv5
 * Manufacturer(11): 1×Lv1, 2×Lv2, 1×Lv3, 1×Lv4, 2×Lv5, 1×Lv6, 1×Lv7, 2×Lv8
 */
export const INDUSTRY_TILE_LEVELS: Record<string, number[]> = {
  cotton:       [1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 4],
  iron:         [1, 2, 3, 4],
  brewery:      [1, 1, 2, 2, 3, 3, 4],
  coal:         [1, 2, 2, 3, 3, 4, 4],
  pottery:      [1, 2, 3, 4, 5],
  manufacturer: [1, 2, 2, 3, 4, 5, 5, 6, 7, 8, 8],
};

/** @deprecated Use INDUSTRY_TILE_LEVELS instead — kept for reference. */
export const INDUSTRY_TILES = INDUSTRY_TILE_LEVELS;

/**
 * Per-tile develop restriction. `true` = this tile CAN be developed.
 * Matches the undevelopable icon (crossed-out arrow) on the physical tiles.
 *
 * Only Pottery Lv1 and Lv3 have the undevelopable icon.
 * All other tiles across all industries CAN be developed.
 */
export const TILE_DEVELOPABLE: Record<string, boolean[]> = {
  cotton:       [true, true, true, true, true, true, true, true, true, true, true],
  iron:         [true, true, true, true],
  brewery:      [true, true, true, true, true, true, true],
  coal:         [true, true, true, true, true, true, true],
  pottery:      [false, true, false, true, true],
  manufacturer: [true, true, true, true, true, true, true, true, true, true, true],
};

/** Check if a specific tile can be developed. */
export function canDevelopTile(industry: string, index: number): boolean {
  return TILE_DEVELOPABLE[industry]?.[index] ?? false;
}

/**
 * Per-tile era restriction: which era(s) a tile can be BUILT in.
 * "both" = Canal or Rail, "canal" = Canal only, "rail" = Rail only.
 *
 * General rule: all Level I tiles are canal-only EXCEPT Pottery I (both).
 * Brewery IV and Pottery V are rail-only.
 * Everything else is both.
 */
export type TileEra = "both" | "canal" | "rail";

export const TILE_ERA: Record<string, TileEra[]> = {
  //                   Lv: 1       1       1       2      2      3       3       3       4       4       4
  cotton:       ["canal","canal","canal","both","both","both","both","both","both","both","both"],
  //                   Lv: 1      2     3     4
  iron:         ["canal","both","both","both"],
  //                   Lv: 1       1       2      2      3      3      4
  brewery:      ["canal","canal","both","both","both","both","rail"],
  //                   Lv: 1       2      2      3      3      4      4
  coal:         ["canal","both","both","both","both","both","both"],
  //                   Lv: 1      2      3      4      5
  pottery:      ["both","both","both","both","rail"],
  //                   Lv: 1       2      2      3      4      5      5      6      7      8      8
  manufacturer: ["canal","both","both","both","both","both","both","both","both","both","both"],
};

/** Check if a tile can be built in the given era. */
export function canBuildInEra(industry: string, index: number, era: "canal" | "rail"): boolean {
  const tileEra = TILE_ERA[industry]?.[index] ?? "both";
  return tileEra === "both" || tileEra === era;
}

/** Number of link tokens per player (canal on one side, rail on the other). */
export const LINK_TOKENS_PER_PLAYER = 14;

/** Player colors matching physical pieces. */
export const PLAYER_COLORS = ["red", "yellow", "green", "purple"] as const;
