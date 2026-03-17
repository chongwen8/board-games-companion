"use client";

import { useState } from "react";
import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import {
  calculateTurnOrder,
  getTotalRounds,
  getIncomePayout,
} from "@/lib/games/brass-birmingham/logic";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface EndOfRoundFlowProps {
  session: Session;
  gameState: BrassGameState;
  onSend: (msg: ClientMessage) => void;
  isHost: boolean;
  onCancel?: () => void;
}

export function EndOfRoundFlow({
  session,
  gameState,
  onSend,
  isHost,
  onCancel,
}: EndOfRoundFlowProps) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, p])
  );
  const totalRounds = getTotalRounds(session.players.length);
  const isLastRound = gameState.round >= totalRounds;

  const newOrder = calculateTurnOrder(
    gameState.roundSpending,
    gameState.turnOrder
  );

  const handleEndRound = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onSend({ type: "GAME_ACTION", action: { type: "END_ROUND" } });
    setConfirming(false);
  };

  const handleEndEra = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onSend({ type: "GAME_ACTION", action: { type: "NEXT_ERA" } });
    setConfirming(false);
  };

  return (
    <div className="space-y-4">
      {/* Spending + Income summary */}
      <h2 className="text-sm font-semibold">
        {t.game.round} {gameState.round}/{totalRounds}
      </h2>

      <div className="space-y-1.5">
        {gameState.turnOrder.map((pid) => {
          const player = playerMap[pid];
          const ps = gameState.playerStates[pid];
          if (!player || !ps) return null;
          const spent = gameState.roundSpending[pid] ?? 0;
          const payout = getIncomePayout(ps.income);

          return (
            <div
              key={pid}
              className="flex items-center gap-3 rounded-xl bg-card/50 px-4 py-2.5"
            >
              <div
                className={`h-3 w-3 rounded-full ${COLOR_DOT[player.color] ?? "bg-gray-500"}`}
              />
              <span className="flex-1 text-sm font-medium">{player.name}</span>
              <span className="text-xs tabular-nums">
                {t.dashboard?.spent ?? "spent"} £{spent}
              </span>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  payout >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {payout >= 0 ? `+£${payout}` : `-£${Math.abs(payout)}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* New turn order */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t.endOfRound.newTurnOrder}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {newOrder.map((pid, idx) => {
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
                {player.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Era transition notes */}
      {isLastRound && gameState.era === "canal" && (
        <div className="rounded-xl bg-amber-500/5 p-3 text-xs space-y-1">
          <p className="font-semibold text-amber-400">
            {t.endOfRound.canalToRail}
          </p>
          <ul className="space-y-0.5 text-muted-foreground list-disc ml-4">
            {t.endOfRound.canalToRailItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {isLastRound && gameState.era === "rail" && (
        <div className="rounded-xl bg-foreground/5 p-3 text-xs space-y-1">
          <p className="font-semibold">
            {t.endOfRound.finalScoring}
          </p>
          <ul className="space-y-0.5 text-muted-foreground list-disc ml-4">
            {t.endOfRound.finalScoringItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action button */}
      {isHost && (
        <div className="space-y-2">
          {isLastRound ? (
            <Button
              onClick={handleEndEra}
              className="w-full rounded-xl"
              size="lg"
              variant={confirming ? "destructive" : "default"}
            >
              {confirming
                ? gameState.era === "canal"
                  ? t.endOfRound.confirmEndCanalEra
                  : t.endOfRound.confirmEndGame
                : gameState.era === "canal"
                  ? t.endOfRound.endCanalEraBtn
                  : t.endOfRound.endGameBtn}
            </Button>
          ) : (
            <Button
              onClick={handleEndRound}
              className="w-full rounded-xl"
              size="lg"
              variant={confirming ? "destructive" : "default"}
            >
              {confirming
                ? t.endOfRound.confirmEndRoundCollect
                : t.endOfRound.endRoundCollect}
            </Button>
          )}
          {confirming ? (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setConfirming(false)}
            >
              {t.endOfRound.back}
            </Button>
          ) : onCancel ? (
            <button
              onClick={onCancel}
              className="w-full pt-2 text-center text-xs text-muted-foreground active:text-foreground"
            >
              {t.endOfRound.back}
            </button>
          ) : null}
        </div>
      )}

      {!isHost && (
        <p className="text-center text-sm text-muted-foreground">
          {t.endOfRound.waitingForHost}
        </p>
      )}
    </div>
  );
}
