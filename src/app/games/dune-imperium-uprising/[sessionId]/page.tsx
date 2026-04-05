"use client";

import { useState } from "react";
import { useDuneUprisingSessionStore } from "@/stores/dune-uprising-session";
import type { DuneGameState } from "@/lib/games/dune-imperium/types";
import type { ClientMessage } from "@/lib/games/dune-imperium/messages";
import type { Session } from "@/lib/games/types";
import { type TabId, BottomNav } from "@/app/games/dune-imperium/[sessionId]/components/BottomNav";
import { Dashboard } from "@/app/games/dune-imperium/[sessionId]/components/Dashboard";
import { GameSummary } from "@/app/games/dune-imperium/[sessionId]/components/GameSummary";
import { GuideTab } from "@/app/games/dune-imperium/[sessionId]/components/GuideTab";
import { GameSessionShell } from "@/components/GameSessionShell";
import { useI18n } from "@/lib/i18n";

function UprisingGameView({
  session,
  gameState,
  playerId,
  isHost,
  onSend,
}: {
  session: Session;
  gameState: DuneGameState;
  playerId: string;
  isHost: boolean;
  onSend: (msg: ClientMessage) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <>
      <div className="mx-auto w-full max-w-lg px-4 pt-14 pb-28">
        {activeTab === "dashboard" && (
          <Dashboard
            session={session}
            gameState={gameState}
            playerId={playerId}
            onSend={onSend}
            isHost={isHost}
          />
        )}

        {activeTab === "guide" && (
          <GuideTab
            session={session}
            gameState={gameState}
            onSend={onSend}
            isHost={isHost}
          />
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}

export default function DuneUprisingSessionPage() {
  const { t } = useI18n();
  const store = useDuneUprisingSessionStore();

  return (
    <GameSessionShell
      gameSlug="dune-imperium-uprising"
      gameTitle={t.dune.game.titleUprising}
      party="dune_uprising"
      store={store}
      isGameOver={(gs) => (gs as DuneGameState)?.phase === "game-over"}
      renderGame={(props) => (
        <UprisingGameView
          session={props.session}
          gameState={props.gameState as DuneGameState}
          playerId={props.playerId}
          isHost={props.isHost}
          onSend={props.onSend}
        />
      )}
      renderGameOver={(props) => (
        <GameSummary
          session={props.session}
          gameState={props.gameState as DuneGameState}
        />
      )}
    />
  );
}
