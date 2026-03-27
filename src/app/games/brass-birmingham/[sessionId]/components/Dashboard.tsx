"use client";

import { useState } from "react";
import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import {
  getTotalRounds,
  calculateTurnOrder,
  getIncomePayout,
} from "@/lib/games/brass-birmingham/logic";
import { Button } from "@/components/ui/button";
import { PlayerCardFull, PlayerCardCompact } from "./PlayerCard";
import { EndOfRoundFlow } from "./EndOfRoundFlow";
import { useI18n } from "@/lib/i18n";

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface DashboardProps {
  session: Session;
  gameState: BrassGameState;
  playerId: string;
  onSend: (msg: ClientMessage) => void;
  isHost: boolean;
}

export function Dashboard({
  session,
  gameState,
  playerId,
  onSend,
  isHost,
}: DashboardProps) {
  const { t } = useI18n();
  const totalRounds = getTotalRounds(session.players.length);
  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, p])
  );
  const [showEndRound, setShowEndRound] = useState(false);

  const myPlayer = playerMap[playerId];

  const previewOrder = calculateTurnOrder(
    gameState.roundSpending,
    gameState.turnOrder
  );

  return (
    <div className="space-y-4">
      {/* Era + Round header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-semibold">
            {gameState.era === "canal" ? t.game.canalEra : t.game.railEra}
          </span>
          <span className="text-sm text-muted-foreground">
            {t.game.round} {gameState.round}/{totalRounds}
          </span>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {t.game.actionsLeft(gameState.actionsRemainingForActivePlayer)}
        </span>
      </div>

      {/* YOUR card — full controls */}
      {myPlayer && (
        <PlayerCardFull
          player={myPlayer}
          gameState={gameState}
          onSend={onSend}
        />
      )}

      {/* All players turn order — you + others */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
          {t.dashboard.turnOrder}
        </p>
        {gameState.turnOrder.map((pid) => {
          const player = playerMap[pid];
          if (!player) return null;
          if (pid === playerId) {
            // Show yourself as a highlighted compact row (not full card again)
            const ps = gameState.playerStates[pid];
            const spent = gameState.roundSpending[pid] ?? 0;
            return (
              <div
                key={pid}
                className="flex items-center gap-3 rounded-xl bg-secondary border border-border px-4 py-2.5"
              >
                <div className={`h-3 w-3 rounded-full ${COLOR_DOT[player.color] ?? "bg-gray-500"}`} />
                <span className="flex-1 text-sm font-semibold">
                  {player.name}
                  <span className="ml-1 text-[10px] text-muted-foreground font-normal">({t.dashboard.you})</span>
                </span>
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  {spent > 0 && <span>{t.dashboard.spent} £{spent}</span>}
                </div>
              </div>
            );
          }
          return (
            <PlayerCardCompact
              key={pid}
              player={player}
              gameState={gameState}
            />
          );
        })}
      </div>

      {/* Next round order preview */}
      <div className="rounded-xl bg-card shadow-xs p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t.spend.nextRoundOrder}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {previewOrder.map((pid, idx) => {
            const player = playerMap[pid];
            if (!player) return null;
            const isMe = pid === playerId;
            return (
              <span
                key={pid}
                className={`flex items-center gap-1 text-xs ${isMe ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {idx > 0 && <span className="text-muted-foreground/50">{"\u2192"}</span>}
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${COLOR_DOT[player.color] ?? "bg-gray-500"}`} />
                {player.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* End Round — host only */}
      {showEndRound ? (
        <div className="rounded-xl border border-border bg-card shadow-sm p-4">
          <EndOfRoundFlow
            session={session}
            gameState={gameState}
            onSend={(msg) => {
              onSend(msg);
              setShowEndRound(false);
            }}
            isHost={isHost}
            onCancel={() => setShowEndRound(false)}
          />
        </div>
      ) : (
        isHost && (
          <Button
            onClick={() => setShowEndRound(true)}
            className="w-full rounded-xl"
            size="lg"
          >
            {t.endOfRound.endRoundBtn}
          </Button>
        )
      )}
    </div>
  );
}
