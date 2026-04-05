"use client";

import { useState } from "react";
import { useDuneSessionStore } from "@/stores/dune-session";
import type { DuneGameState } from "@/lib/games/dune-imperium/types";
import type { ClientMessage } from "@/lib/games/dune-imperium/messages";
import type { Session } from "@/lib/games/types";
import { type TabId, BottomNav } from "./components/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { GameSummary } from "./components/GameSummary";
import { GuideTab } from "./components/GuideTab";
import { GameSessionShell } from "@/components/GameSessionShell";
import { useI18n } from "@/lib/i18n";

function DuneGameView({
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

export default function DuneSessionPage() {
  const { t } = useI18n();
  const store = useDuneSessionStore();

  return (
    <GameSessionShell
      gameSlug="dune-imperium"
      gameTitle={t.dune.game.title}
      party="dune_imperium"
      store={store}
      isGameOver={(gs) => (gs as DuneGameState)?.phase === "game-over"}
      renderGame={(props) => (
        <DuneGameView
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
