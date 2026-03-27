"use client";

import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { Session } from "@/lib/games/types";
import { useI18n } from "@/lib/i18n";

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface GameSummaryProps {
  session: Session;
  gameState: BrassGameState;
}

export function GameSummary({ session, gameState }: GameSummaryProps) {
  const { t } = useI18n();
  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, p])
  );

  const scores = gameState.turnOrder.map((pid) => {
    const player = playerMap[pid];
    const ps = gameState.playerStates[pid];
    if (!player || !ps)
      return { pid, name: "?", color: "red", vp: 0, money: 0, moneyVP: 0, loans: 0, loanPenalty: 0, income: 0, total: 0 };

    const moneyVP = Math.floor(ps.money / 10);
    const loanPenalty = ps.loans * 10;
    const total = ps.vp + moneyVP - loanPenalty;

    return {
      pid,
      name: player.name,
      color: player.color,
      vp: ps.vp,
      money: ps.money,
      moneyVP,
      loans: ps.loans,
      loanPenalty,
      income: ps.income,
      total,
    };
  });

  scores.sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t.summary.gameOver}</h1>
        <p className="text-sm text-muted-foreground">{t.summary.finalScores}</p>
      </div>

      <div className="space-y-3">
        {scores.map((s, idx) => (
          <div
            key={s.pid}
            className={`rounded-2xl p-5 ${
              idx === 0
                ? "bg-amber-50 ring-1 ring-amber-300"
                : "bg-card shadow-xs"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-muted-foreground/60">
                {idx === 0 ? "\u{1F3C6}" : `#${idx + 1}`}
              </span>
              <div className={`h-4 w-4 rounded-full ${COLOR_DOT[s.color] ?? "bg-gray-500"}`} />
              <span className="flex-1 text-lg font-semibold">{s.name}</span>
              <span className="text-2xl font-bold text-amber-600">
                {s.total}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-secondary px-2 py-1">
                {t.summary.industryLinks}: {s.vp}
              </span>
              <span className="rounded-md bg-secondary px-2 py-1">
                {t.summary.moneyBonus}: {"\u00A3"}{s.money} {"\u2192"} +{s.moneyVP}
              </span>
              {s.loans > 0 && (
                <span className="rounded-md bg-red-50 px-2 py-1 text-red-600">
                  {t.summary.loanPenalty}: {s.loans} {"\u2192"} -{s.loanPenalty}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-card shadow-sm p-4">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t.summary.gameStats}
        </h3>
        <div className="grid grid-cols-2 gap-1 text-sm">
          <span className="text-muted-foreground">{t.summary.players}</span>
          <span>{session.players.length}</span>
          <span className="text-muted-foreground">{t.summary.actionsTaken}</span>
          <span>{gameState.history?.length ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
