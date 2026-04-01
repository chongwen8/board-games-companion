"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { FactionTrack } from "./FactionTrack";
import { FACTION_IDS } from "@/lib/games/dune-imperium/constants";
import type { DunePlayerState, DuneAction } from "@/lib/games/dune-imperium/types";
import type { Player } from "@/lib/games/types";
import { useI18n } from "@/lib/i18n";

const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface ResourceRowProps {
  label: string;
  value: number;
  onAdjust: (delta: number) => void;
  showLargeButtons?: boolean;
}

function ResourceRow({ label, value, onAdjust, showLargeButtons = false }: ResourceRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs font-medium text-muted-foreground w-16">{label}</span>
      <span className="text-lg font-bold tabular-nums flex-1 text-center">{value}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-xs" onClick={() => onAdjust(-1)} className="h-7 w-7">
          <Minus className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={() => onAdjust(1)} className="h-7 w-7">
          <Plus className="h-3 w-3" />
        </Button>
        {showLargeButtons && (
          <>
            <Button variant="outline" size="icon-xs" onClick={() => onAdjust(5)} className="h-7 w-7 text-[10px]">
              +5
            </Button>
            <Button variant="outline" size="icon-xs" onClick={() => onAdjust(10)} className="h-7 w-7 text-[10px]">
              +10
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// --- Full interactive card for the current player ---

interface PlayerCardFullProps {
  player: Player;
  playerState: DunePlayerState;
  onSend: (msg: { type: "GAME_ACTION"; action: DuneAction }) => void;
}

export function PlayerCardFull({ player, playerState, onSend }: PlayerCardFullProps) {
  const { t } = useI18n();

  const sendAction = (action: DuneAction) =>
    onSend({ type: "GAME_ACTION", action });

  return (
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
      {/* Color bar header */}
      <div className={`${COLOR_CLASSES[player.color] ?? "bg-gray-500"} px-4 py-2 flex items-center justify-between`}>
        <span className="text-sm font-bold text-white">{player.name}</span>
        <span className="text-xs font-semibold text-white/80">
          VP: {playerState.vp}
        </span>
      </div>

      <div className="px-4 py-3 space-y-1">
        {/* Resources */}
        <ResourceRow
          label={t.dune.resources.spice}
          value={playerState.spice}
          onAdjust={(delta) => sendAction({ type: "ADJUST_SPICE", playerId: player.id, delta })}
        />
        <ResourceRow
          label={t.dune.resources.solari}
          value={playerState.solari}
          onAdjust={(delta) => sendAction({ type: "ADJUST_SOLARI", playerId: player.id, delta })}
        />
        <ResourceRow
          label={t.dune.resources.water}
          value={playerState.water}
          onAdjust={(delta) => sendAction({ type: "ADJUST_WATER", playerId: player.id, delta })}
        />
        <ResourceRow
          label={t.dune.resources.vp}
          value={playerState.vp}
          onAdjust={(delta) => sendAction({ type: "ADJUST_VP", playerId: player.id, delta })}
          showLargeButtons
        />
        <ResourceRow
          label={t.dune.resources.intrigue}
          value={playerState.intrigue ?? 0}
          onAdjust={(delta) => sendAction({ type: "ADJUST_INTRIGUE", playerId: player.id, delta })}
        />
      </div>

      {/* Faction influence */}
      <div className="px-4 pb-4 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pt-1">
          {t.dune.influence.influence}
        </p>
        {FACTION_IDS.map((fid) => (
          <FactionTrack
            key={fid}
            faction={fid}
            influence={playerState.factions[fid]}
            interactive
            onAdjust={(delta) =>
              sendAction({ type: "ADJUST_INFLUENCE", playerId: player.id, faction: fid, delta })
            }
          />
        ))}
      </div>
    </div>
  );
}

// --- Compact read-only card for other players ---

interface PlayerCardCompactProps {
  player: Player;
  playerState: DunePlayerState;
}

export function PlayerCardCompact({ player, playerState }: PlayerCardCompactProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl bg-card shadow-xs px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`h-4 w-4 rounded-full ${COLOR_CLASSES[player.color] ?? "bg-gray-500"}`} />
        <span className="text-sm font-medium flex-1">{player.name}</span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span title={t.dune.resources.spice}>🌶 {playerState.spice}</span>
          <span title={t.dune.resources.solari}>💰 {playerState.solari}</span>
          <span title={t.dune.resources.water}>💧 {playerState.water}</span>
          <span title={t.dune.resources.intrigue}>🃏 {playerState.intrigue ?? 0}</span>
          <span className="font-semibold text-foreground" title={t.dune.resources.vp}>
            VP {playerState.vp}
          </span>
        </div>
      </div>

      {/* Compact faction display */}
      <div className="flex items-center gap-2 mt-2">
        {FACTION_IDS.map((fid) => {
          const inf = playerState.factions[fid];
          const hasAlliance = inf.hasAlliance;
          return (
            <div
              key={fid}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ${
                hasAlliance
                  ? "bg-amber-100 text-amber-700 font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
              title={t.dune.factions[fid]}
            >
              <span>{t.dune.factions[fid].charAt(0)}</span>
              <span>{inf.level}</span>
              {hasAlliance && <span>★</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
