"use client";

import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const COLOR_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface VPPanelProps {
  session: Session;
  gameState: BrassGameState;
  onSend: (msg: ClientMessage) => void;
}

export function VPPanel({ session, gameState, onSend }: VPPanelProps) {
  const { t } = useI18n();
  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, p])
  );

  const handleAdjustVP = (playerId: string, delta: number) => {
    onSend({
      type: "GAME_ACTION",
      action: { type: "ADJUST_VP", playerId, delta },
    });
  };

  const handleAdjustMoney = (playerId: string, delta: number) => {
    onSend({
      type: "GAME_ACTION",
      action: { type: "ADJUST_MONEY", playerId, delta },
    });
  };

  return (
    <div className="space-y-3">
      {gameState.turnOrder.map((pid) => {
        const player = playerMap[pid];
        const ps = gameState.playerStates[pid];
        if (!player || !ps) return null;

        return (
          <div key={pid} className="space-y-3 rounded-xl bg-card/50 p-4">
            {/* Player header */}
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${COLOR_DOT[player.color] ?? "bg-gray-500"}`} />
              <span className="flex-1 text-sm font-semibold">{player.name}</span>
            </div>

            {/* VP row */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-medium text-muted-foreground">{t.vp.vp}</span>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleAdjustVP(pid, -1)}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-14 text-center font-mono text-lg font-bold text-amber-400">
                {ps.vp}
              </span>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleAdjustVP(pid, 1)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <div className="flex flex-1 justify-end gap-1">
                {[5, 10].map((amt) => (
                  <button
                    key={amt}
                    className="rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium active:bg-muted"
                    onClick={() => handleAdjustVP(pid, amt)}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Money row */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-medium text-muted-foreground">{t.vp.money}</span>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleAdjustMoney(pid, -1)}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-14 text-center font-mono text-lg font-bold">
                {"\u00A3"}{ps.money}
              </span>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleAdjustMoney(pid, 1)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <div className="flex flex-1 justify-end gap-1">
                {[5, 10].map((amt) => (
                  <button
                    key={amt}
                    className="rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium active:bg-muted"
                    onClick={() => handleAdjustMoney(pid, amt)}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
