"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { FactionTrack } from "./FactionTrack";
import { FACTION_IDS, MAX_SPY, MAX_DREADNOUGHT, MAX_TROOPS, TROOP_STRENGTH } from "@/lib/games/dune-imperium/constants";
import { getCombatStrength } from "@/lib/games/dune-imperium/logic";
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
  icon?: string;
  value: number;
  onAdjust: (delta: number) => void;
  showLargeButtons?: boolean;
}

function ResourceRow({ label, icon, value, onAdjust, showLargeButtons = false }: ResourceRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs font-medium text-muted-foreground w-20 flex items-center gap-1">
        {icon && <span>{icon}</span>}{label}
      </span>
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

interface CappedResourceRowProps {
  label: string;
  icon?: string | React.ReactNode;
  value: number;
  max: number;
  onAdjust: (delta: number) => void;
}

function CappedResourceRow({ label, icon, value, max, onAdjust }: CappedResourceRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs font-medium text-muted-foreground w-20 flex items-center gap-1">
        {icon && <span>{icon}</span>}{label}
      </span>
      <span className="text-lg font-bold tabular-nums flex-1 text-center">
        {value}<span className="text-xs font-normal text-muted-foreground">/{max}</span>
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-xs" onClick={() => onAdjust(-1)} disabled={value <= 0} className="h-7 w-7">
          <Minus className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={() => onAdjust(1)} disabled={value >= max} className="h-7 w-7">
          <Plus className="h-3 w-3" />
        </Button>
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
          icon="🌶"
          label={t.dune.resources.spice}
          value={playerState.spice}
          onAdjust={(delta) => sendAction({ type: "ADJUST_SPICE", playerId: player.id, delta })}
        />
        <ResourceRow
          icon="💰"
          label={t.dune.resources.solari}
          value={playerState.solari}
          onAdjust={(delta) => sendAction({ type: "ADJUST_SOLARI", playerId: player.id, delta })}
        />
        <ResourceRow
          icon="💧"
          label={t.dune.resources.water}
          value={playerState.water}
          onAdjust={(delta) => sendAction({ type: "ADJUST_WATER", playerId: player.id, delta })}
        />
        <ResourceRow
          icon="⭐"
          label={t.dune.resources.vp}
          value={playerState.vp}
          onAdjust={(delta) => sendAction({ type: "ADJUST_VP", playerId: player.id, delta })}
          showLargeButtons
        />
        <ResourceRow
          icon="🃏"
          label={t.dune.resources.intrigue}
          value={playerState.intrigue ?? 0}
          onAdjust={(delta) => sendAction({ type: "ADJUST_INTRIGUE", playerId: player.id, delta })}
        />
        {/* Dreadnought — both games, max 2 */}
        <CappedResourceRow
          icon={<Image src="/icons/dreadnought.png" alt="DN" width={16} height={16} />}
          label={t.dune.resources.dreadnought}
          value={playerState.dreadnought ?? 0}
          max={MAX_DREADNOUGHT}
          onAdjust={(delta) => sendAction({ type: "ADJUST_DREADNOUGHT", playerId: player.id, delta })}
        />
        {/* Spy — Uprising only */}
        {playerState.spy !== undefined && (
          <CappedResourceRow
            icon="🕵"
            label={t.dune.resources.spy}
            value={playerState.spy}
            max={MAX_SPY}
            onAdjust={(delta) => sendAction({ type: "ADJUST_SPY", playerId: player.id, delta })}
          />
        )}
      </div>

      {/* Troops & Combat */}
      <div className="px-4 py-3 border-t border-border space-y-3">
        {/* Troop flow: Supply → Garrison → Combat */}
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{t.dune.dashboard.troops}</span>
          <span className="text-xs font-normal">({t.dune.dashboard.supply}: {MAX_TROOPS - (playerState.garrison ?? 0) - (playerState.combat ?? 0)})</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Garrison */}
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">{t.dune.dashboard.garrison}</span>
              <span className="text-lg font-bold tabular-nums">{playerState.garrison ?? 0}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon-xs" className="h-6 w-6" disabled={(playerState.garrison ?? 0) <= 0}
                onClick={() => sendAction({ type: "ADJUST_GARRISON", playerId: player.id, delta: -1 })}>
                <Minus className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon-xs" className="h-6 w-6"
                disabled={MAX_TROOPS - (playerState.garrison ?? 0) - (playerState.combat ?? 0) <= 0}
                onClick={() => sendAction({ type: "ADJUST_GARRISON", playerId: player.id, delta: 1 })}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon-xs" className="h-6 flex-1 text-[10px]"
                disabled={MAX_TROOPS - (playerState.garrison ?? 0) - (playerState.combat ?? 0) <= 0}
                onClick={() => sendAction({ type: "ADJUST_GARRISON", playerId: player.id, delta: 5 })}>+5</Button>
            </div>
          </div>

          {/* Combat */}
          <div className="rounded-lg bg-red-50 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-red-600">{t.dune.dashboard.combatTroops}</span>
              <span className="text-lg font-bold tabular-nums text-red-600">{playerState.combat ?? 0}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon-xs" className="h-6 w-6" disabled={(playerState.combat ?? 0) <= 0}
                onClick={() => sendAction({ type: "ADJUST_COMBAT_TROOPS", playerId: player.id, delta: -1 })}>
                <Minus className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon-xs" className="h-6 w-6"
                disabled={(playerState.garrison ?? 0) <= 0}
                onClick={() => sendAction({ type: "ADJUST_COMBAT_TROOPS", playerId: player.id, delta: 1 })}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon-xs" className="h-6 flex-1 text-[10px]"
                disabled={(playerState.garrison ?? 0) <= 0}
                onClick={() => sendAction({ type: "ADJUST_COMBAT_TROOPS", playerId: player.id, delta: 5 })}>+5</Button>
            </div>
          </div>
        </div>

        {/* Combat Strength */}
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase text-amber-700">⚔ {t.dune.dashboard.combatStrength}</span>
          <span className="text-xl font-bold text-amber-600 flex-1 text-center">{getCombatStrength(playerState)}</span>
          <div className="text-[10px] text-muted-foreground">
            {(playerState.combat ?? 0) > 0 && <span>{playerState.combat}×{TROOP_STRENGTH}</span>}
            {(playerState.combatBonus ?? 0) > 0 && <span> +{playerState.combatBonus}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground flex-1">{t.dune.dashboard.combatBonus}</span>
          <Button variant="outline" size="icon-xs" className="h-7 w-7" disabled={(playerState.combatBonus ?? 0) <= 0}
            onClick={() => sendAction({ type: "ADJUST_COMBAT_BONUS", playerId: player.id, delta: -1 })}>
            <Minus className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="icon-xs" className="h-7 w-7"
            onClick={() => sendAction({ type: "ADJUST_COMBAT_BONUS", playerId: player.id, delta: 1 })}>
            <Plus className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="icon-xs" className="h-7 text-[10px] px-2"
            onClick={() => sendAction({ type: "ADJUST_COMBAT_BONUS", playerId: player.id, delta: 3 })}>
            <Image src="/icons/dreadnought.png" alt="DN" width={16} height={16} className="inline" />+3
          </Button>
          <Button variant="outline" size="icon-xs" className="h-7 text-[10px] px-2"
            onClick={() => sendAction({ type: "ADJUST_COMBAT_BONUS", playerId: player.id, delta: 5 })}>
            +5
          </Button>
        </div>
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap justify-end">
          <span title={t.dune.resources.spice}>🌶{playerState.spice}</span>
          <span title={t.dune.resources.solari}>💰{playerState.solari}</span>
          <span title={t.dune.resources.water}>💧{playerState.water}</span>
          <span title={t.dune.resources.dreadnought}><Image src="/icons/dreadnought.png" alt="DN" width={14} height={14} className="inline" />{playerState.dreadnought ?? 0}</span>
          {playerState.spy !== undefined && (
            <span title={t.dune.resources.spy}>🕵{playerState.spy}/{MAX_SPY}</span>
          )}
          <span className="font-semibold text-foreground" title={t.dune.resources.vp}>
            VP {playerState.vp}
          </span>
        </div>
      </div>

      {/* Troop status + faction display */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span>{t.dune.dashboard.garrison}: {playerState.garrison ?? 0}</span>
        <span className="text-red-600">{t.dune.dashboard.combatTroops}: {playerState.combat ?? 0}</span>
        {getCombatStrength(playerState) > 0 && (
          <span className="font-semibold text-amber-600">⚔ {getCombatStrength(playerState)}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
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
