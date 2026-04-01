"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { PlayerCardFull, PlayerCardCompact } from "./PlayerCard";
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
  const [confirmEndGame, setConfirmEndGame] = useState(false);

  const myPlayer = session.players.find((p) => p.id === playerId);
  const myState = gameState.playerStates[playerId];

  const handleAdvanceRound = () => {
    onSend({ type: "GAME_ACTION", action: { type: "NEXT_ROUND" } });
  };

  const handleEndGame = () => {
    if (confirmEndGame) {
      onSend({ type: "GAME_ACTION", action: { type: "END_GAME" } });
      setConfirmEndGame(false);
    } else {
      setConfirmEndGame(true);
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Round header — host can tap to advance */}
      <div className="flex items-center justify-between">
        {isHost ? (
          <button
            onClick={handleAdvanceRound}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium transition-colors active:bg-muted"
          >
            {t.dune.game.round} {gameState.round}
            <Plus className="h-3 w-3 text-muted-foreground" />
          </button>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {t.dune.game.round} {gameState.round}
          </Badge>
        )}
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

      {/* End Game (host only) */}
      {isHost && (
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleEndGame}
            className="w-full rounded-xl"
            size="lg"
            variant={confirmEndGame ? "destructive" : "outline"}
          >
            {confirmEndGame
              ? t.dune.dashboard.confirmEndGame
              : t.dune.dashboard.endGame}
          </Button>
          {confirmEndGame && (
            <Button
              onClick={() => setConfirmEndGame(false)}
              variant="ghost"
              className="w-full rounded-xl"
              size="sm"
            >
              {t.endOfRound.back}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
