"use client";

import type { BrassGameState, BrassAction } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import { INDUSTRY_TILE_LEVELS } from "@/lib/games/brass-birmingham/constants";
import { Undo2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Convert a tile index to its level for display. */
function tileLevel(industry: string, index: number): number {
  const levels = INDUSTRY_TILE_LEVELS[industry];
  return levels?.[index] ?? index + 1;
}

const COLOR_CLASSES: Record<string, string> = {
  red: "text-red-400",
  yellow: "text-amber-400",
  green: "text-emerald-400",
  purple: "text-violet-400",
};

function useActionDescription() {
  const { t } = useI18n();

  return function describeAction(
    action: BrassAction,
    playerMap: Record<string, { name: string; color: string }>
  ): string {
    const a = t.history.actions;
    switch (action.type) {
      case "RECORD_SPEND":
        return a.spent(playerMap[action.playerId]?.name ?? "?", action.amount);
      case "ADJUST_SPEND":
        return a.spendingSet(playerMap[action.playerId]?.name ?? "?", action.amount);
      case "END_TURN":
        return a.turnEnded;
      case "END_ROUND":
        return a.roundEnded;
      case "NEXT_ERA":
        return a.eraTransition;
      case "TAKE_LOAN":
        return a.tookLoan(playerMap[action.playerId]?.name ?? "?");
      case "ADJUST_INCOME":
        return a.incomeAdjusted(playerMap[action.playerId]?.name ?? "?", action.delta);
      case "ADJUST_VP":
        return a.vpAdjusted(playerMap[action.playerId]?.name ?? "?", action.delta);
      case "ADJUST_MONEY":
        return a.moneyAdjusted(playerMap[action.playerId]?.name ?? "?", action.delta);
      case "BUILD_TILE":
        return a.built(playerMap[action.playerId]?.name ?? "?", action.industry, tileLevel(action.industry, action.index));
      case "DEVELOP_TILE":
        return a.developed(playerMap[action.playerId]?.name ?? "?", action.industry, tileLevel(action.industry, action.index));
      case "CYCLE_TILE":
        return a.toggled(playerMap[action.playerId]?.name ?? "?", action.industry, tileLevel(action.industry, action.index));
      case "END_GAME":
        return a.gameEnded;
      case "UNDO":
        return a.undoAction;
      default:
        return a.unknown;
    }
  };
}

function getActionPlayerId(action: BrassAction): string | null {
  if ("playerId" in action) return action.playerId;
  return null;
}

interface ActionHistoryProps {
  session: Session;
  gameState: BrassGameState;
  onSend: (msg: ClientMessage) => void;
  isHost: boolean;
}

export function ActionHistory({
  session,
  gameState,
  onSend,
  isHost,
}: ActionHistoryProps) {
  const { t } = useI18n();
  const describeAction = useActionDescription();

  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, { name: p.name, color: p.color }])
  );

  const history = gameState.history ?? [];
  const recentHistory = history.slice(-20).reverse();
  const canUndo = (gameState._undoStack?.length ?? 0) > 0;

  const handleUndo = () => {
    onSend({ type: "GAME_ACTION", action: { type: "UNDO" } });
  };

  return (
    <div className="space-y-3">
      {/* Undo button — host only, when undo stack has entries */}
      {isHost && canUndo && (
        <div className="flex justify-end">
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors active:bg-muted"
          >
            <Undo2 className="h-3 w-3" />
            {t.history.undo}
          </button>
        </div>
      )}

      {recentHistory.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t.history.noActions}
        </p>
      )}

      <div className="space-y-0.5">
        {recentHistory.map((entry, idx) => {
          const pid = getActionPlayerId(entry.action);
          const player = pid ? playerMap[pid] : null;
          const colorClass = player
            ? COLOR_CLASSES[player.color] ?? "text-muted-foreground"
            : "text-muted-foreground";

          return (
            <div
              key={history.length - 1 - idx}
              className="flex items-start gap-3 rounded-lg px-2 py-2 text-sm"
            >
              <span className="mt-0.5 w-12 shrink-0 text-[10px] tabular-nums text-muted-foreground/60">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className={`text-xs leading-relaxed ${colorClass}`}>
                {describeAction(entry.action, playerMap)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
