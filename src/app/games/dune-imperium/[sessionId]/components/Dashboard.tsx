"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayerCardFull, PlayerCardCompact } from "./PlayerCard";
import { CombatResolution } from "./CombatResolution";
import { hasCombatParticipants } from "@/lib/games/dune-imperium/logic";
import { MAX_ROUNDS } from "@/lib/games/dune-imperium/constants";
import type { DuneGameState, DuneAction } from "@/lib/games/dune-imperium/types";
import type { Session } from "@/lib/games/types";
import { useI18n } from "@/lib/i18n";

interface DashboardProps {
  session: Session;
  gameState: DuneGameState;
  playerId: string;
  onSend: (msg: { type: "GAME_ACTION"; action: DuneAction }) => void;
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
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmSkipCombat, setConfirmSkipCombat] = useState(false);
  const myPlayer = session.players.find((p) => p.id === playerId);
  const myState = gameState.playerStates[playerId];
  const isFinalRound = gameState.round >= MAX_ROUNDS;

  const handleNextRound = () => {
    if (hasCombatParticipants(gameState.playerStates, gameState.turnOrder)) {
      onSend({ type: "GAME_ACTION", action: { type: "BEGIN_COMBAT" } });
      setConfirmSkipCombat(false);
    } else if (!confirmSkipCombat) {
      // No combat — warn first
      setConfirmSkipCombat(true);
    } else if (isFinalRound && !confirmEnd) {
      setConfirmEnd(true);
    } else {
      onSend({ type: "GAME_ACTION", action: { type: "NEXT_ROUND" } });
      setConfirmEnd(false);
      setConfirmSkipCombat(false);
    }
  };

  // --- Combat Resolution Phase ---
  if (gameState.phase === "combat") {
    return (
      <div className="space-y-4 py-4">
        <Badge variant="secondary" className="text-xs">
          {t.dune.game.round} {gameState.round}
        </Badge>

        <CombatResolution
          session={session}
          gameState={gameState}
          onSend={onSend}
          isHost={isHost}
        />
      </div>
    );
  }

  // --- Normal Playing Phase ---
  return (
    <div className="space-y-4 py-4">
      {/* Round header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {t.dune.game.round} {gameState.round}/{MAX_ROUNDS}
        </Badge>
      </div>

      {/* Current player's card */}
      {myPlayer && myState && (
        <PlayerCardFull
          player={myPlayer}
          playerState={myState}
          onSend={onSend}
        />
      )}

      {/* Other players */}
      {gameState.turnOrder
        .filter((pid) => pid !== playerId)
        .map((pid) => {
          const player = session.players.find((p) => p.id === pid);
          const ps = gameState.playerStates[pid];
          if (!player || !ps) return null;
          return (
            <PlayerCardCompact
              key={pid}
              player={player}
              playerState={ps}
            />
          );
        })}

      {/* Host controls */}
      {isHost ? (
        <div className="space-y-2 pt-2">
          {confirmSkipCombat && !confirmEnd && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 space-y-1">
              <p className="font-semibold">{t.dune.dashboard.noCombat}</p>
              <p>{t.dune.dashboard.skipCombat}</p>
            </div>
          )}
          {confirmEnd && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 space-y-1">
              <p className="font-semibold">{t.dune.dashboard.finalRound}</p>
              <p>{t.dune.dashboard.finalRoundWarning}</p>
            </div>
          )}
          <Button
            onClick={handleNextRound}
            className="w-full rounded-xl"
            size="lg"
            variant={confirmEnd ? "destructive" : confirmSkipCombat ? "secondary" : "default"}
          >
            {confirmEnd
              ? t.dune.dashboard.confirmEndGame
              : confirmSkipCombat
                ? t.dune.dashboard.confirmNextRound
                : isFinalRound
                  ? t.dune.dashboard.endGame
                  : t.dune.dashboard.nextRound}
          </Button>
          {(confirmEnd || confirmSkipCombat) && (
            <Button
              onClick={() => { setConfirmEnd(false); setConfirmSkipCombat(false); }}
              variant="ghost"
              className="w-full rounded-xl"
              size="sm"
            >
              {t.endOfRound.back}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground pt-2">
          {t.dune.dashboard.waitingForHost}
        </p>
      )}
    </div>
  );
}
