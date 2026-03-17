"use client";

import { useState } from "react";
import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import { getIncomePayout } from "@/lib/games/brass-birmingham/logic";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface IncomePanelProps {
  session: Session;
  gameState: BrassGameState;
  onSend: (msg: ClientMessage) => void;
}

export function IncomePanel({ session, gameState, onSend }: IncomePanelProps) {
  const { t } = useI18n();
  const [confirmLoan, setConfirmLoan] = useState<string | null>(null);
  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, p])
  );

  const handleAdjustIncome = (playerId: string, delta: number) => {
    onSend({
      type: "GAME_ACTION",
      action: { type: "ADJUST_INCOME", playerId, delta },
    });
  };

  const handleTakeLoan = (playerId: string) => {
    if (confirmLoan !== playerId) {
      setConfirmLoan(playerId);
      return;
    }
    onSend({
      type: "GAME_ACTION",
      action: { type: "TAKE_LOAN", playerId },
    });
    setConfirmLoan(null);
  };

  return (
    <div className="space-y-3">
      {gameState.turnOrder.map((pid) => {
        const player = playerMap[pid];
        const ps = gameState.playerStates[pid];
        if (!player || !ps) return null;
        const payout = getIncomePayout(ps.income);

        return (
          <div key={pid} className="space-y-3 rounded-xl bg-card/50 p-4">
            {/* Player header */}
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${COLOR_DOT[player.color] ?? "bg-gray-500"}`} />
              <span className="flex-1 text-sm font-semibold">{player.name}</span>
              <span className="text-xs font-medium">{"\u00A3"}{ps.money}</span>
            </div>

            {/* Income control */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-medium text-muted-foreground">{t.income.income}</span>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleAdjustIncome(pid, -1)}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-14 text-center font-mono text-lg font-bold">
                {ps.income}
              </span>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleAdjustIncome(pid, 1)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <span className="flex-1 text-right text-xs">
                {payout >= 0 ? (
                  <span className="text-emerald-400">+{"\u00A3"}{payout}{t.income.perRound}</span>
                ) : (
                  <span className="text-red-400">-{"\u00A3"}{Math.abs(payout)}{t.income.perRound}</span>
                )}
              </span>
            </div>

            {/* Loan */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-medium text-muted-foreground">
                {t.income.loans}: {ps.loans}
              </span>
              {confirmLoan === pid ? (
                <>
                  <button
                    className="flex-1 rounded-lg bg-red-500/10 py-2.5 text-xs font-medium text-red-400 active:bg-red-500/20"
                    onClick={() => handleTakeLoan(pid)}
                  >
                    {t.income.confirmLoan}
                  </button>
                  <button
                    className="rounded-lg bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground active:bg-muted"
                    onClick={() => setConfirmLoan(null)}
                  >
                    {t.income.cancel}
                  </button>
                </>
              ) : (
                <button
                  className="rounded-lg bg-muted/50 px-4 py-2.5 text-xs font-medium active:bg-muted"
                  onClick={() => handleTakeLoan(pid)}
                >
                  {t.income.takeLoan}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
