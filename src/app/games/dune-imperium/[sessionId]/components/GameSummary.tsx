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

  // Sort by VP, then tiebreakers: spice → solari → water → garrison
  const ranked = [...gameState.turnOrder]
    .map((pid) => ({
      pid,
      player: session.players.find((p) => p.id === pid)!,
      state: gameState.playerStates[pid],
    }))
    .filter((r) => r.player && r.state)
    .sort((a, b) => {
      if (b.state.vp !== a.state.vp) return b.state.vp - a.state.vp;
      if (b.state.spice !== a.state.spice) return b.state.spice - a.state.spice;
      if (b.state.solari !== a.state.solari) return b.state.solari - a.state.solari;
      if (b.state.water !== a.state.water) return b.state.water - a.state.water;
      return (b.state.garrison ?? 0) - (a.state.garrison ?? 0);
    });

  const isTied = (a: typeof ranked[0], b: typeof ranked[0]) =>
    a.state.vp === b.state.vp &&
    a.state.spice === b.state.spice &&
    a.state.solari === b.state.solari &&
    a.state.water === b.state.water &&
    (a.state.garrison ?? 0) === (b.state.garrison ?? 0);

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
              i === 0 || isTied(ranked[0], r) ? "ring-2 ring-amber-400" : ""
            }`}
          >
            <div
              className={`${COLOR_CLASSES[r.player.color] ?? "bg-gray-500"} px-4 py-2 flex items-center justify-between`}
            >
              <span className="text-sm font-bold text-white">
                {i === 0 || isTied(ranked[0], r) ? "🏆" : medals[i] ?? `#${i + 1}`} {r.player.name}
              </span>
              <span className="text-lg font-bold text-white">
                {r.state.vp} VP
              </span>
            </div>

            <div className="px-4 py-3">
              {/* Resources (tiebreaker order) */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="rounded-md bg-secondary px-2 py-1">🌶 {r.state.spice}</span>
                <span className="rounded-md bg-secondary px-2 py-1">💰 {r.state.solari}</span>
                <span className="rounded-md bg-secondary px-2 py-1">💧 {r.state.water}</span>
                <span className="rounded-md bg-secondary px-2 py-1">{t.dune.dashboard.garrison}: {r.state.garrison ?? 0}</span>
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

      <p className="text-center text-xs text-muted-foreground">
        {t.dune.summary.tiebreaker}
      </p>

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
