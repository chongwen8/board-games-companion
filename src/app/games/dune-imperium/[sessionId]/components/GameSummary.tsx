"use client";

import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { FACTION_IDS } from "@/lib/games/dune-imperium/constants";
import type { DuneGameState } from "@/lib/games/dune-imperium/types";
import type { Session } from "@/lib/games/types";
import { useI18n } from "@/lib/i18n";

const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface GameSummaryProps {
  session: Session;
  gameState: DuneGameState;
}

export function GameSummary({ session, gameState }: GameSummaryProps) {
  const { t } = useI18n();

  // Sort players by VP descending
  const ranked = [...gameState.turnOrder]
    .map((pid) => ({
      pid,
      player: session.players.find((p) => p.id === pid)!,
      state: gameState.playerStates[pid],
    }))
    .filter((r) => r.player && r.state)
    .sort((a, b) => b.state.vp - a.state.vp);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{t.dune.summary.gameOver}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.dune.summary.finalStandings}
        </p>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {ranked.map((r, i) => (
          <div
            key={r.pid}
            className={`rounded-2xl bg-card shadow-sm overflow-hidden ${
              i === 0 ? "ring-2 ring-amber-400" : ""
            }`}
          >
            <div
              className={`${COLOR_CLASSES[r.player.color] ?? "bg-gray-500"} px-4 py-2 flex items-center justify-between`}
            >
              <span className="text-sm font-bold text-white">
                {medals[i] ?? `#${i + 1}`} {r.player.name}
              </span>
              <span className="text-lg font-bold text-white">
                {r.state.vp} VP
              </span>
            </div>

            <div className="px-4 py-3">
              {/* Resources */}
              <div className="flex items-center gap-4 text-sm">
                <span>{t.dune.resources.spice}: {r.state.spice}</span>
                <span>{t.dune.resources.solari}: {r.state.solari}</span>
                <span>{t.dune.resources.water}: {r.state.water}</span>
              </div>

              {/* Alliance status */}
              <div className="flex items-center gap-2 mt-2">
                {FACTION_IDS.map((fid) => {
                  const inf = r.state.factions[fid];
                  if (!inf.hasAlliance) return null;
                  return (
                    <Badge key={fid} variant="secondary" className="text-[10px] gap-1">
                      <Shield className="h-3 w-3" />
                      {t.dune.factions[fid]}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Game stats */}
      <div className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
        <p className="font-semibold">{t.dune.summary.gameStats}</p>
        <p>
          {session.players.length} {t.summary.players} · {gameState.round} {t.dune.game.round.toLowerCase()}s ·{" "}
          {gameState.history.length} {t.summary.actionsTaken.toLowerCase()}
        </p>
      </div>
    </div>
  );
}
