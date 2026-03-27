"use client";

import { useState } from "react";
import type {
  BrassGameState,
  IndustryType,
  TileStatus,
} from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import {
  INDUSTRY_TILE_LEVELS,
  canDevelopTile,
  canBuildInEra,
  TILE_ERA,
  type TileEra,
} from "@/lib/games/brass-birmingham/constants";
import type { Era } from "@/lib/games/brass-birmingham/types";
import { ChevronDown } from "lucide-react";
import {
  IndustryIcon,
  INDUSTRY_BG,
  INDUSTRY_BORDER,
  INDUSTRY_COLORS,
} from "@/components/IndustryIcon";
import { useI18n } from "@/lib/i18n";

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

const INDUSTRY_ORDER: IndustryType[] = [
  "cotton",
  "manufacturer",
  "pottery",
  "coal",
  "iron",
  "brewery",
];

function nextAvailableIndex(stack: TileStatus[]): number | null {
  for (let i = 0; i < stack.length; i++) {
    if (stack[i] === "available") return i;
  }
  return null;
}

function groupByLevel(
  industry: string
): { level: number; startIdx: number; count: number }[] {
  const levels = INDUSTRY_TILE_LEVELS[industry];
  if (!levels) return [];
  const groups: { level: number; startIdx: number; count: number }[] = [];
  for (let i = 0; i < levels.length; i++) {
    const last = groups[groups.length - 1];
    if (last && last.level === levels[i]) {
      last.count++;
    } else {
      groups.push({ level: levels[i], startIdx: i, count: 1 });
    }
  }
  return groups;
}

interface IndustryGridProps {
  session: Session;
  gameState: BrassGameState;
  playerId: string;
  onSend: (msg: ClientMessage) => void;
}

export function IndustryGrid({
  session,
  gameState,
  playerId,
  onSend,
}: IndustryGridProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState<IndustryType | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, p])
  );
  const myPlayer = playerMap[playerId];

  const handleCycle = (
    pid: string,
    industry: IndustryType,
    index: number
  ) => {
    onSend({
      type: "GAME_ACTION",
      action: { type: "CYCLE_TILE", playerId: pid, industry, index },
    });
  };

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex items-center gap-5 px-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-border bg-muted/70" />
          {t.industry.available}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          {t.industry.built}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
          {t.industry.developed}
        </span>
      </div>

      {INDUSTRY_ORDER.map((industry) => {
        const isOpen = expanded === industry;
        const groups = groupByLevel(industry);

        // Your tile state
        const myStack = gameState.playerStates[playerId]?.industryStacks[industry];
        const myNextIdx = myStack ? nextAvailableIndex(myStack) : null;
        const levels = INDUSTRY_TILE_LEVELS[industry];
        const myNextLvl = myNextIdx !== null && levels ? levels[myNextIdx] : null;

        return (
          <div
            key={industry}
            className={`overflow-hidden rounded-xl border transition-colors ${
              isOpen
                ? `${INDUSTRY_BORDER[industry]} ${INDUSTRY_BG[industry]}`
                : "border-border bg-card shadow-xs"
            }`}
          >
            {/* Header */}
            <button
              onClick={() => setExpanded(isOpen ? null : industry)}
              className="flex w-full items-center gap-3 px-4 py-3 active:opacity-70"
            >
              <IndustryIcon industry={industry} size={18} />
              <span
                className={`flex-1 text-left text-sm font-semibold ${
                  isOpen ? INDUSTRY_COLORS[industry] : ""
                }`}
              >
                {t.industry[industry]}
              </span>

              {/* Collapsed: show your next level */}
              {!isOpen && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {myNextLvl ? `${t.industry.next}: Lv${myNextLvl}` : t.industry.done}
                </span>
              )}

              <ChevronDown
                className={`h-4 w-4 text-muted-foreground/50 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Expanded */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-4">
                {/* YOUR tiles — interactive */}
                {myPlayer && myStack && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${COLOR_DOT[myPlayer.color]}`} />
                      <span className="text-xs font-semibold">{myPlayer.name}</span>
                      <span className="text-[10px] text-muted-foreground">({t.dashboard.you})</span>
                    </div>
                    <TileTrack
                      groups={groups}
                      stack={myStack}
                      locked={gameState.playerStates[playerId]?.lockedTiles?.[industry]}
                      industry={industry}
                      era={gameState.era}
                      onCycle={(idx) => handleCycle(playerId, industry, idx)}
                    />
                  </div>
                )}

                {/* OTHER players — read-only, toggle to show */}
                {gameState.turnOrder.filter((pid) => pid !== playerId).length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowOthers(!showOthers)}
                      className="text-[10px] text-muted-foreground/60 active:text-muted-foreground"
                    >
                      {showOthers ? `${t.industry.hideOthers} ▲` : `${t.industry.showOthers} ▼`}
                    </button>

                    {showOthers && (
                      <div className="mt-2 space-y-3">
                        {gameState.turnOrder
                          .filter((pid) => pid !== playerId)
                          .map((pid) => {
                            const player = playerMap[pid];
                            const ps = gameState.playerStates[pid];
                            if (!player || !ps) return null;
                            const stack = ps.industryStacks[industry];
                            const ni = nextAvailableIndex(stack);
                            const nlvl = ni !== null && levels ? levels[ni] : null;

                            return (
                              <div key={pid} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block h-2 w-2 rounded-full ${COLOR_DOT[player.color]}`} />
                                  <span className="text-[11px] text-muted-foreground">{player.name}</span>
                                  <span className="text-[10px] text-muted-foreground/50">
                                    {nlvl ? `${t.industry.next}: Lv${nlvl}` : t.industry.done}
                                  </span>
                                </div>
                                <TileTrack
                                  groups={groups}
                                  stack={stack}
                                  industry={industry}
                                  era={gameState.era}
                                  readonly
                                />
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tile progress track                                               */
/* ------------------------------------------------------------------ */

function TileTrack({
  groups,
  stack,
  locked,
  industry,
  era,
  onCycle,
  readonly,
}: {
  groups: { level: number; startIdx: number; count: number }[];
  stack: TileStatus[];
  locked?: boolean[];
  industry: string;
  era: Era;
  onCycle?: (index: number) => void;
  readonly?: boolean;
}) {
  const ni = nextAvailableIndex(stack);

  return (
    <div className="flex items-end gap-0.5 flex-wrap">
      {groups.map((g) => {
        // Check if ANY tile in this level group has an era restriction
        const firstIdx = g.startIdx;
        const tileEra = TILE_ERA[industry]?.[firstIdx] ?? "both";
        const levelRestricted =
          (era === "canal" && tileEra === "rail") ||
          (era === "rail" && tileEra === "canal");

        return (
          <div key={g.level} className="flex flex-col items-center mr-1.5 last:mr-0">
            <span className={`mb-0.5 text-[9px] tabular-nums ${levelRestricted ? "text-red-500/60 line-through" : tileEra === "rail" ? "text-blue-600/60" : tileEra === "canal" ? "text-amber-600/60" : "text-muted-foreground/50"}`}>
              {g.level}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: g.count }, (_, j) => {
                const idx = g.startIdx + j;
                const status = stack[idx];
                const isNext = idx === ni;
                const isLocked = ni !== null && idx > ni;
                const developable = canDevelopTile(industry, idx);
                const buildable = canBuildInEra(industry, idx, era);

                // Available tile that can't be built in current era
                const cantBuild = !buildable && status === "available";

                // Tile locked from a previous round (permanent)
                const isLockedFromPrevRound = locked?.[idx] === true;

                return (
                  <button
                    key={idx}
                    disabled={readonly || isLocked || isLockedFromPrevRound}
                    onClick={() => onCycle?.(idx)}
                    title={
                      isLockedFromPrevRound
                        ? "Locked from previous round"
                        : isLocked
                          ? "Complete earlier tiles first"
                          : cantBuild
                            ? `Can't build in ${era === "canal" ? "Canal" : "Rail"} Era`
                            : status === "available"
                              ? "Tap: mark as built"
                              : status === "built" && !developable
                                ? "Tap: reset (can't develop)"
                                : status === "built"
                                  ? "Tap: mark as developed"
                                  : "Tap: reset"
                    }
                    className={`
                      flex items-center justify-center rounded-md text-xs font-semibold transition-all
                      ${readonly ? "h-6 w-6 text-[10px]" : "h-8 w-8"}
                      ${readonly || isLocked || isLockedFromPrevRound ? "cursor-default" : "active:scale-90"}
                      ${isLocked && !readonly ? "opacity-20" : ""}
                      ${
                        status === "built"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "developed"
                            ? "bg-amber-100 text-amber-700"
                            : cantBuild
                              ? "border border-red-300 bg-red-50 text-red-400"
                              : isNext && !readonly
                                ? "border border-border bg-secondary text-foreground/70"
                                : "bg-muted/50 text-muted-foreground/40"
                      }
                    `}
                  >
                    {status === "built"
                      ? "\u2713"
                      : status === "developed"
                        ? "\u2717"
                        : cantBuild
                          ? "\u2215"
                          : isNext && !readonly
                            ? "\u25CB"
                            : ""}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
