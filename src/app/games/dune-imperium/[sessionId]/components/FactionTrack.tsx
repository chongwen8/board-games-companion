"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Shield } from "lucide-react";
import { FACTIONS } from "@/lib/games/dune-imperium/constants";
import type { FactionId, FactionInfluence } from "@/lib/games/dune-imperium/types";
import { useI18n } from "@/lib/i18n";

const FACTION_COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  yellow: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
};

interface FactionTrackProps {
  faction: FactionId;
  influence: FactionInfluence;
  interactive?: boolean;
  onAdjust?: (delta: number) => void;
}

export function FactionTrack({
  faction,
  influence,
  interactive = false,
  onAdjust,
}: FactionTrackProps) {
  const { t } = useI18n();
  const def = FACTIONS[faction];
  if (!def) return null;

  const colors = FACTION_COLOR_CLASSES[def.color] ?? FACTION_COLOR_CLASSES.yellow;
  const factionName = t.dune.factions[faction] || def.name;

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${colors.bg} border ${colors.border}`}>
      {/* Faction dot + name */}
      <div className={`h-3 w-3 rounded-full ${colors.dot} shrink-0`} />
      <span className={`text-xs font-medium ${colors.text} min-w-[80px]`}>
        {factionName}
      </span>

      {/* Influence track dots */}
      <div className="flex items-center gap-1 flex-1">
        {Array.from({ length: def.maxInfluence + 1 }, (_, i) => {
          const isFilled = i <= influence.level;
          const isThreshold = def.thresholds.some((th) => th.level === i);
          const isAllianceLevel = i === def.allianceLevel;

          return (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                isFilled
                  ? `${colors.dot} border-transparent text-white`
                  : isAllianceLevel
                    ? `border-dashed ${colors.border} bg-transparent`
                    : isThreshold
                      ? `${colors.border} bg-transparent`
                      : "border-muted bg-transparent"
              }`}
            >
              {isAllianceLevel && !isFilled ? "★" : i > 0 ? i : ""}
            </div>
          );
        })}
      </div>

      {/* Alliance token */}
      {influence.hasAlliance && (
        <Shield className={`h-4 w-4 ${colors.text} shrink-0`} />
      )}

      {/* Level number */}
      <span className={`text-sm font-bold ${colors.text} w-4 text-center`}>
        {influence.level}
      </span>

      {/* +/- buttons */}
      {interactive && onAdjust && (
        <div className="flex gap-1 shrink-0">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onAdjust(-1)}
            disabled={influence.level <= 0}
            className="h-6 w-6"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onAdjust(1)}
            disabled={influence.level >= def.maxInfluence}
            className="h-6 w-6"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
