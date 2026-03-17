"use client";

import { useState } from "react";
import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import { calculateTurnOrder } from "@/lib/games/brass-birmingham/logic";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

const QUICK_AMOUNTS = [1, 5, 10];

interface SpendTrackerProps {
  session: Session;
  gameState: BrassGameState;
  playerId: string;
  onSend: (msg: ClientMessage) => void;
}

export function SpendTracker({
  session,
  gameState,
  playerId,
  onSend,
}: SpendTrackerProps) {
  const { t } = useI18n();
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, p])
  );

  const handleSpend = (pid: string, amount: number) => {
    onSend({
      type: "GAME_ACTION",
      action: { type: "RECORD_SPEND", playerId: pid, amount },
    });
  };

  const handleSetSpend = (pid: string, amount: number) => {
    onSend({
      type: "GAME_ACTION",
      action: { type: "ADJUST_SPEND", playerId: pid, amount: Math.max(0, amount) },
    });
  };

  const previewOrder = calculateTurnOrder(
    gameState.roundSpending,
    gameState.turnOrder
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {t.spend.recordSpending}
      </h2>

      <div className="space-y-3">
        {gameState.turnOrder.map((pid) => {
          const player = playerMap[pid];
          if (!player) return null;
          const spent = gameState.roundSpending[pid] ?? 0;
          const ps = gameState.playerStates[pid];
          const isExpanded = expandedPlayer === pid;

          return (
            <div
              key={pid}
              className="overflow-hidden rounded-xl bg-card/60"
            >
              {/* Player header */}
              <button
                onClick={() => setExpandedPlayer(isExpanded ? null : pid)}
                className="flex w-full items-center gap-2.5 px-4 py-3 active:bg-muted/30"
              >
                <div
                  className={`h-3 w-3 rounded-full ${COLOR_DOT[player.color] ?? "bg-gray-500"}`}
                />
                <span className="flex-1 text-left text-sm font-medium">
                  {player.name}
                </span>
                {ps && (
                  <span className="text-xs text-muted-foreground">
                    {"\u00A3"}{ps.money} {t.spend.remaining}
                  </span>
                )}
              </button>

              {/* Spend controls */}
              <div className="flex items-center gap-2 px-4 pb-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-xl"
                  onClick={() => handleSetSpend(pid, spent - 1)}
                  disabled={spent <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <div className="flex-1 rounded-xl bg-muted/50 py-2.5 text-center font-mono text-2xl font-bold">
                  {"\u00A3"}{spent}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-xl"
                  onClick={() => handleSpend(pid, 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick amounts */}
              {isExpanded && (
                <div className="flex gap-2 px-4 pb-3">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      className="flex-1 rounded-lg bg-muted/50 py-2.5 text-xs font-medium active:bg-muted"
                      onClick={() => handleSpend(pid, amt)}
                    >
                      +{"\u00A3"}{amt}
                    </button>
                  ))}
                  <button
                    className="flex-1 rounded-lg bg-muted/50 py-2.5 text-xs font-medium text-muted-foreground active:bg-muted"
                    onClick={() => handleSetSpend(pid, 0)}
                  >
                    {t.spend.reset}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Turn order preview */}
      <div className="rounded-xl bg-card/30 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t.spend.nextRoundOrder}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {previewOrder.map((pid, idx) => {
            const player = playerMap[pid];
            if (!player) return null;
            return (
              <span key={pid} className="flex items-center gap-1 text-xs">
                {idx > 0 && (
                  <span className="text-muted-foreground/50">{"\u2192"}</span>
                )}
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${COLOR_DOT[player.color] ?? "bg-gray-500"}`}
                />
                <span className="text-muted-foreground">{player.name}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
