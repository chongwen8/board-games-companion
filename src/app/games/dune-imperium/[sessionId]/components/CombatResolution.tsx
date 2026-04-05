"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rankCombatResults } from "@/lib/games/dune-imperium/logic";
import { TROOP_STRENGTH, MAX_ROUNDS } from "@/lib/games/dune-imperium/constants";
import type { DuneGameState, DuneAction } from "@/lib/games/dune-imperium/types";
import type { Session } from "@/lib/games/types";
import { useI18n } from "@/lib/i18n";

const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

const RANK_LABELS = ["🥇", "🥈", "🥉", "#4"];

interface CombatResolutionProps {
  session: Session;
  gameState: DuneGameState;
  onSend: (msg: { type: "GAME_ACTION"; action: DuneAction }) => void;
  isHost: boolean;
}

export function CombatResolution({
  session,
  gameState,
  onSend,
  isHost,
}: CombatResolutionProps) {
  const { t } = useI18n();
  const [confirmed, setConfirmed] = useState(false);

  const results = rankCombatResults(gameState.playerStates, gameState.turnOrder);

  const handleResolve = () => {
    if (confirmed) {
      onSend({ type: "GAME_ACTION", action: { type: "RESOLVE_COMBAT" } });
      setConfirmed(false);
    } else {
      setConfirmed(true);
    }
  };

  return (
    <div className="rounded-2xl bg-card shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-bold">{t.dune.dashboard.combatResults}</h3>

      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.dune.dashboard.noCombat}</p>
      ) : (
        <div className="space-y-2">
          {results.map((r, i) => {
            const player = session.players.find((p) => p.id === r.playerId);
            if (!player) return null;
            return (
              <div
                key={r.playerId}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  i === 0 ? "bg-amber-50 border border-amber-200" : "bg-muted"
                }`}
              >
                <span className="text-lg shrink-0">{RANK_LABELS[i] ?? `#${i + 1}`}</span>
                <div className={`h-4 w-4 rounded-full ${COLOR_CLASSES[player.color] ?? "bg-gray-500"} shrink-0`} />
                <span className="text-sm font-medium flex-1">{player.name}</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-amber-600">{r.strength}</span>
                  <div className="text-[10px] text-muted-foreground">
                    {r.troops > 0 && <span>{r.troops}×{TROOP_STRENGTH}</span>}
                    {r.bonus > 0 && <span> +{r.bonus}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t.dune.dashboard.combatResolveDesc}</p>

      {gameState.round >= MAX_ROUNDS && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 space-y-1">
          <p className="font-semibold">{t.dune.dashboard.finalRound}</p>
          <p>{t.dune.dashboard.finalRoundWarning}</p>
        </div>
      )}

      {isHost ? (
        <div className="space-y-2">
          <Button
            onClick={handleResolve}
            className="w-full rounded-xl"
            size="lg"
            variant={confirmed ? "destructive" : "default"}
          >
            {confirmed ? t.dune.dashboard.confirmResolve : t.dune.dashboard.nextRound}
          </Button>
          <Button
            onClick={() => {
              setConfirmed(false);
              onSend({ type: "GAME_ACTION", action: { type: "UNDO" } });
            }}
            variant="ghost"
            className="w-full rounded-xl"
            size="sm"
          >
            {t.endOfRound.back}
          </Button>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          {t.dune.dashboard.waitingForHost}
        </p>
      )}
    </div>
  );
}
