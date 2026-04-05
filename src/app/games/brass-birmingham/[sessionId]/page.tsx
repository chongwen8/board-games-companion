"use client";

import { useState } from "react";
import { useBrassSessionStore } from "@/stores/brass-session";
import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import { type TabId, BottomNav } from "./components/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { IndustryGrid } from "./components/IndustryGrid";
import { GameSummary } from "./components/GameSummary";
import { GuideTab } from "./components/GuideTab";
import { GameSessionShell } from "@/components/GameSessionShell";
import { useI18n } from "@/lib/i18n";

function BrassGameView({
  session,
  gameState,
  playerId,
  isHost,
  onSend,
}: {
  session: Session;
  gameState: BrassGameState;
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

        {activeTab === "industry" && (
          <IndustryGrid
            session={session}
            gameState={gameState}
            playerId={playerId}
            onSend={onSend}
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

export default function BrassSessionPage() {
  const { t } = useI18n();
  const store = useBrassSessionStore();

  return (
    <GameSessionShell
      gameSlug="brass-birmingham"
      gameTitle={t.game.title}
      store={store}
      isGameOver={(gs) => (gs as BrassGameState)?.phase === "game-over"}
      renderGame={(props) => (
        <BrassGameView
          session={props.session}
          gameState={props.gameState as BrassGameState}
          playerId={props.playerId}
          isHost={props.isHost}
          onSend={props.onSend}
        />
      )}
      renderGameOver={(props) => (
        <GameSummary
          session={props.session}
          gameState={props.gameState as BrassGameState}
        />
      )}
    />
  );
}
