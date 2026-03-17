"use client";

import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Player } from "@/lib/games/types";
import { getIncomePayout } from "@/lib/games/brass-birmingham/logic";
import { useI18n } from "@/lib/i18n";

const COLOR_BAR: Record<string, string> = {
  red: "bg-red-600",
  yellow: "bg-amber-500",
  green: "bg-emerald-600",
  purple: "bg-violet-600",
};

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

/* ------------------------------------------------------------------ */
/*  Full card — shown on YOUR device                                  */
/* ------------------------------------------------------------------ */

interface PlayerCardFullProps {
  player: Player;
  gameState: BrassGameState;
  onSend: (msg: ClientMessage) => void;
}

export function PlayerCardFull({
  player,
  gameState,
  onSend,
}: PlayerCardFullProps) {
  const { t } = useI18n();
  const ps = gameState.playerStates[player.id];
  if (!ps) return null;

  const spent = gameState.roundSpending[player.id] ?? 0;
  const payout = getIncomePayout(ps.income);

  const pid = player.id;
  const adjustMoney = (d: number) =>
    onSend({ type: "GAME_ACTION", action: { type: "ADJUST_MONEY", playerId: pid, delta: d } });
  const adjustSpend = (a: number) =>
    onSend({ type: "GAME_ACTION", action: { type: "ADJUST_SPEND", playerId: pid, amount: Math.max(0, a) } });
  const recordSpend = (a: number) =>
    onSend({ type: "GAME_ACTION", action: { type: "RECORD_SPEND", playerId: pid, amount: a } });
  const adjustIncome = (d: number) =>
    onSend({ type: "GAME_ACTION", action: { type: "ADJUST_INCOME", playerId: pid, delta: d } });
  const adjustVP = (d: number) =>
    onSend({ type: "GAME_ACTION", action: { type: "ADJUST_VP", playerId: pid, delta: d } });
  const takeLoan = () =>
    onSend({ type: "GAME_ACTION", action: { type: "TAKE_LOAN", playerId: pid } });

  const btnBase =
    "h-10 border border-border/40 text-sm font-medium active:bg-muted disabled:opacity-25";

  return (
    <div className="overflow-hidden rounded-xl">
      {/* Color bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${COLOR_BAR[player.color] ?? "bg-gray-600"}`}>
        <span className="text-sm font-bold text-white">{player.name}</span>
        <div className="flex items-center gap-3 text-[11px] text-white/80">
          {ps.vp > 0 && <span>{ps.vp} {t.playerCard.vp}</span>}
          {ps.loans > 0 && <span>{t.playerCard.nLoans(ps.loans)}</span>}
        </div>
      </div>

      <div className="bg-card/40">
        {/* Money */}
        <Row label={t.playerCard.money} value={ps.money}>
          <button onClick={() => adjustMoney(-1)} className={`${btnBase} w-12 rounded-l-lg bg-muted/30`}>−</button>
          <button onClick={() => adjustMoney(1)} className={`${btnBase} w-12 border-l-0 bg-muted/50`}>+</button>
          <button onClick={takeLoan} className={`${btnBase} w-14 rounded-r-lg border-l-0 bg-muted/30 text-xs`}>{t.playerCard.loan}</button>
        </Row>

        {/* Spent */}
        <Row label={t.playerCard.spent} value={spent} border>
          <button onClick={() => adjustSpend(spent - 1)} disabled={spent <= 0} className={`${btnBase} w-12 rounded-l-lg bg-muted/30`}>−</button>
          <button onClick={() => recordSpend(1)} className={`${btnBase} w-12 border-l-0 bg-muted/50`}>+</button>
          <button onClick={() => recordSpend(5)} className={`${btnBase} w-14 rounded-r-lg border-l-0 bg-muted/30 text-xs`}>+5</button>
        </Row>

        {/* Income */}
        <Row
          label={t.playerCard.income}
          border
          value={
            <>
              <span className="font-bold">{ps.income}</span>
              <span className="text-muted-foreground"> = </span>
              <span className={payout >= 0 ? "text-emerald-400" : "text-red-400"}>
                £{payout}
              </span>
            </>
          }
        >
          <button onClick={() => adjustIncome(-1)} disabled={ps.income <= 0} className={`${btnBase} w-12 rounded-l-lg bg-muted/30`}>−</button>
          <button onClick={() => adjustIncome(1)} disabled={ps.income >= 99} className={`${btnBase} w-12 rounded-r-lg border-l-0 bg-muted/50`}>+</button>
        </Row>

        {/* VP */}
        <Row
          label={t.playerCard.vp}
          border
          value={<span className="font-bold text-amber-400">{ps.vp}</span>}
        >
          <button onClick={() => adjustVP(-1)} disabled={ps.vp <= 0} className={`${btnBase} w-12 rounded-l-lg bg-muted/30`}>−</button>
          <button onClick={() => adjustVP(1)} className={`${btnBase} w-12 border-l-0 bg-muted/50`}>+</button>
          <button onClick={() => adjustVP(5)} className={`${btnBase} w-12 border-l-0 bg-muted/30 text-xs`}>+5</button>
          <button onClick={() => adjustVP(10)} className={`${btnBase} w-12 rounded-r-lg border-l-0 bg-muted/30 text-xs`}>+10</button>
        </Row>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compact row — shown for OTHER players (read-only summary)         */
/* ------------------------------------------------------------------ */

interface PlayerCardCompactProps {
  player: Player;
  gameState: BrassGameState;
}

export function PlayerCardCompact({ player, gameState }: PlayerCardCompactProps) {
  const { t } = useI18n();
  const ps = gameState.playerStates[player.id];
  if (!ps) return null;

  const spent = gameState.roundSpending[player.id] ?? 0;
  const payout = getIncomePayout(ps.income);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card/30 px-4 py-2.5">
      <div className={`h-3 w-3 rounded-full ${COLOR_DOT[player.color] ?? "bg-gray-500"}`} />
      <span className="flex-1 text-sm font-medium">{player.name}</span>
      <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
        <span>£{ps.money}</span>
        {spent > 0 && <span className="text-foreground">{t.dashboard.spent} £{spent}</span>}
        <span className={payout >= 0 ? "text-emerald-400/70" : "text-red-400/70"}>
          {payout >= 0 ? `+£${payout}` : `-£${Math.abs(payout)}`}
        </span>
        {ps.vp > 0 && <span className="text-amber-400/70">{ps.vp}VP</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared row layout                                                 */
/* ------------------------------------------------------------------ */

function Row({
  label,
  value,
  border,
  children,
}: {
  label: string;
  value: React.ReactNode;
  border?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 ${border ? "border-t border-border/15" : ""}`}>
      <span className="w-16 text-xs text-muted-foreground">{label}</span>
      <span className="flex-1 text-lg tabular-nums">{value}</span>
      <div className="flex">{children}</div>
    </div>
  );
}
