"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import PartySocket from "partysocket";
import { usePartySocket } from "@/lib/hooks/use-party-socket";
import { useBrassSessionStore } from "@/stores/brass-session";
import { getPlayerId } from "@/lib/utils/player-id";
import type { Session } from "@/lib/games/types";
import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, LogOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNav, type TabId } from "./components/BottomNav";
import { Dashboard } from "./components/Dashboard";
import { IndustryGrid } from "./components/IndustryGrid";
import { GameSummary } from "./components/GameSummary";
import { GuideTab } from "./components/GuideTab";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { saveSession, loadSession } from "@/lib/firestore";
import { saveActiveSession, clearActiveSession } from "@/lib/utils/active-session";
import { FEATURES } from "@/lib/config";
import { useI18n } from "@/lib/i18n";

const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-400",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

function SessionContent() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const action = searchParams.get("action");
  const playerName = searchParams.get("name") ?? "Player";

  const { session, gameState, setSession, setGameState, setPlayerId } =
    useBrassSessionStore();
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const lobbyRegistered = useRef(false);

  const playerId = typeof window !== "undefined" ? getPlayerId() : "";

  useEffect(() => {
    if (playerId) setPlayerId(playerId);
  }, [playerId, setPlayerId]);

  // Persist to Firestore on state changes (debounced)
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!FEATURES.PERSISTENCE) return;
    if (!session || !gameState) return;
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => {
      saveSession(sessionId, session, gameState).catch(console.error);
    }, 2000);
    return () => {
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    };
  }, [sessionId, session, gameState]);

  // Try to rehydrate from Firestore if WebSocket doesn't have state
  const rehydrated = useRef(false);
  useEffect(() => {
    if (!FEATURES.PERSISTENCE) return;
    if (rehydrated.current || session) return;
    rehydrated.current = true;
    loadSession(sessionId).then((saved) => {
      if (saved && !session) {
        setSession(saved.session);
        if (saved.gameState) setGameState(saved.gameState);
      }
    }).catch(console.error);
  }, [sessionId, session, setSession, setGameState]);

  const handleSession = useCallback(
    (s: Session) => {
      setSession(s);
      if (!lobbyRegistered.current && s.code) {
        lobbyRegistered.current = true;
        const lobbySocket = new PartySocket({
          host: PARTYKIT_HOST,
          party: "lobby",
          room: "main",
        });
        lobbySocket.addEventListener("open", () => {
          lobbySocket.send(
            JSON.stringify({
              type: "REGISTER_CODE",
              code: s.code,
              roomId: s.id,
            })
          );
          setTimeout(() => lobbySocket.close(), 500);
        });
      }
    },
    [setSession]
  );

  const handleGameState = useCallback(
    (gs: BrassGameState) => setGameState(gs),
    [setGameState]
  );

  const handleError = useCallback((msg: string) => setError(msg), []);

  const handleSessionEnded = useCallback(() => {
    clearActiveSession();
    useBrassSessionStore.getState().reset();
    router.push("/games/brass-birmingham");
  }, [router]);

  const { send, connected } = usePartySocket({
    roomId: sessionId,
    onSession: handleSession,
    onGameState: handleGameState,
    onError: handleError,
    onSessionEnded: handleSessionEnded,
  });

  // Save active session to localStorage for reconnect
  useEffect(() => {
    if (connected && sessionId) {
      saveActiveSession({
        sessionId,
        gameSlug: "brass-birmingham",
        playerName,
        joinedAt: Date.now(),
      });
    }
  }, [connected, sessionId, playerName]);

  const sendMessage = useCallback(
    (msg: ClientMessage) => send(msg),
    [send]
  );

  // On connect, create or join session
  const hasSentAction = useRef(false);
  useEffect(() => {
    if (!connected || hasSentAction.current || !playerId) return;
    hasSentAction.current = true;

    if (action === "create") {
      send({
        type: "CREATE_SESSION",
        player: { id: playerId, name: playerName },
      });
    } else {
      send({
        type: "JOIN_SESSION",
        player: { id: playerId, name: playerName },
        code: "",
      });
    }
  }, [connected, action, playerId, playerName, send]);

  const handleStartGame = useCallback(() => {
    if (!session) return;
    send({ type: "START_GAME", playerCount: session.players.length });
  }, [session, send]);

  const isHost = session?.hostPlayerId === playerId;

  const handleExit = () => {
    if (isHost) {
      // Admin exit ends the session for everyone
      send({ type: "END_SESSION" });
    }
    clearActiveSession();
    useBrassSessionStore.getState().reset();
    router.push("/games/brass-birmingham");
  };

  const handleRestart = () => {
    send({ type: "RESET_GAME" });
  };

  // --- Game Over View ---
  if (session?.status === "active" && gameState?.phase === "game-over") {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 space-y-6">
        <GameSummary session={session} gameState={gameState} />
        <div className="space-y-2">
          {isHost && (
            <Button
              onClick={handleRestart}
              className="w-full rounded-xl"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              New Game (Same Players)
            </Button>
          )}
          <Button
            onClick={handleExit}
            variant="outline"
            className="w-full rounded-xl"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Exit to Lobby
          </Button>
        </div>
      </div>
    );
  }

  // --- Game Active View (tabbed) ---
  if (session?.status === "active" && gameState) {
    return (
      <>
        {/* Top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-bold">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  connected ? "bg-emerald-500" : "animate-pulse bg-red-500"
                }`}
              />
              {t.game.title}
            </span>
            <div className="flex items-center gap-2">
              {!connected && (
                <Badge variant="destructive" className="text-[10px]">
                  {t.game.reconnecting}
                </Badge>
              )}
              <LanguageSwitcher />
              <button
                onClick={handleExit}
                className="rounded-lg p-1.5 text-muted-foreground active:bg-muted active:text-foreground"
                title="Exit to lobby"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="mx-auto w-full max-w-lg px-4 pt-14 pb-20">
          {activeTab === "dashboard" && (
            <Dashboard
              session={session}
              gameState={gameState}
              playerId={playerId}
              onSend={sendMessage}
              isHost={isHost}
            />
          )}

          {activeTab === "industry" && (
            <IndustryGrid
              session={session}
              gameState={gameState}
              playerId={playerId}
              onSend={sendMessage}
            />
          )}

          {activeTab === "guide" && (
            <GuideTab
              session={session}
              gameState={gameState}
              onSend={sendMessage}
              isHost={isHost}
            />
          )}
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  // --- Lobby View ---
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold">{t.game.title}</h1>
          {!connected && (
            <Badge variant="destructive" className="mt-2">
              {t.game.connecting}
            </Badge>
          )}
        </div>
        <LanguageSwitcher />
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {session && (
        <>
          <div className="rounded-2xl bg-card/50 p-6 text-center">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t.lobby.sessionCode}
            </p>
            <p className="font-mono text-4xl font-bold tracking-[0.3em]">
              {session.code}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.lobby.shareCode}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t.lobby.players} ({session.players.length}/4)
            </p>
            {session.players.map((p) => {
              const isBot = p.id.startsWith("bot-");
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-card/50 px-4 py-3"
                >
                  <div
                    className={`h-4 w-4 rounded-full ${COLOR_CLASSES[p.color] ?? "bg-gray-500"}`}
                  />
                  <span className="flex-1 font-medium">
                    {p.name}
                    {p.id === session.hostPlayerId && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({t.lobby.host})
                      </span>
                    )}
                  </span>
                  {isBot && isHost ? (
                    <button
                      onClick={() =>
                        send({ type: "REMOVE_BOT", botId: p.id })
                      }
                      className="rounded-lg p-2 text-muted-foreground active:bg-destructive/20 active:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <span
                      className={`text-xs ${p.connected ? "text-emerald-400" : "text-muted-foreground"}`}
                    >
                      {isBot ? t.lobby.bot : p.connected ? t.lobby.connected : t.lobby.disconnected}
                    </span>
                  )}
                </div>
              );
            })}

            {isHost && session.players.length < 4 && (
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => send({ type: "ADD_BOT" })}
              >
                {t.lobby.addBot}
              </Button>
            )}
          </div>

          {isHost && session.players.length >= 2 && (
            <Button onClick={handleStartGame} className="w-full rounded-xl" size="lg">
              {t.lobby.startGame(session.players.length)}
            </Button>
          )}
          {isHost && session.players.length < 2 && (
            <p className="text-center text-sm text-muted-foreground">
              {t.lobby.waitingForPlayers}
            </p>
          )}
          {!isHost && (
            <p className="text-center text-sm text-muted-foreground">
              {t.lobby.waitingForHost}
            </p>
          )}
        </>
      )}

      {!session && connected && (
        <p className="text-center text-sm text-muted-foreground">
          {t.game.settingUp}
        </p>
      )}

      {/* Exit lobby */}
      <button
        onClick={handleExit}
        className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground active:text-foreground"
      >
        <LogOut className="h-3 w-3" />
        {isHost ? "End Session & Exit" : "Leave Session"}
      </button>
    </div>
  );
}

export default function BrassSessionPage() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <Suspense
        fallback={
          <p className="text-muted-foreground">{t.game.loadingSession}</p>
        }
      >
        <SessionContent />
      </Suspense>
    </main>
  );
}
