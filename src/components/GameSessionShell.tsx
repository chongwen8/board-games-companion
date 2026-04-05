"use client";

import { Suspense, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import PartySocket from "partysocket";
import { usePartySocket } from "@/lib/hooks/use-party-socket";
import { getPlayerId } from "@/lib/utils/player-id";
import type { Session } from "@/lib/games/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, RotateCcw } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { saveSession, loadSession } from "@/lib/firestore";
import { saveActiveSession, clearActiveSession } from "@/lib/utils/active-session";
import { FEATURES } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { SessionLobby } from "./SessionLobby";

const RAW_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
const PARTYKIT_HOST = RAW_HOST.replace(/^https?:\/\//, "");

interface SessionStore {
  session: Session | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameState: any;
  setSession: (session: Session) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setGameState: (gameState: any) => void;
  setPlayerId: (id: string) => void;
  reset: () => void;
}

interface GameRenderProps {
  session: Session;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameState: any;
  playerId: string;
  isHost: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSend: (msg: any) => void;
}

interface GameOverRenderProps {
  session: Session;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameState: any;
}

interface GameSessionShellProps {
  gameSlug: string;
  gameTitle: string;
  /** PartyKit party name. Omit to use the default (main) party. */
  party?: string;
  store: SessionStore;
  /** Check if game state indicates game-over. */
  isGameOver: (gameState: unknown) => boolean;
  renderGame: (props: GameRenderProps) => ReactNode;
  renderGameOver: (props: GameOverRenderProps) => ReactNode;
}

function SessionContent({
  gameSlug,
  gameTitle,
  party,
  store,
  isGameOver,
  renderGame,
  renderGameOver,
}: GameSessionShellProps) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const action = searchParams.get("action");
  const playerName = searchParams.get("name") ?? "Player";

  const { session, gameState, setSession, setGameState, setPlayerId } = store;
  const [error, setError] = useState("");
  const lobbyRegistered = useRef(false);

  const [playerId, setLocalPlayerId] = useState("");

  useEffect(() => {
    const id = getPlayerId();
    setLocalPlayerId(id);
    if (id) setPlayerId(id);
  }, [setPlayerId]);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gs: any) => setGameState(gs),
    [setGameState]
  );

  const handleError = useCallback((msg: string) => setError(msg), []);

  const handleSessionEnded = useCallback(() => {
    clearActiveSession();
    store.reset();
    router.push(`/games/${gameSlug}`);
  }, [router, store, gameSlug]);

  const { send, connected } = usePartySocket({
    roomId: sessionId,
    party,
    playerId,
    onSession: handleSession,
    onGameState: handleGameState,
    onError: handleError,
    onSessionEnded: handleSessionEnded,
  });

  // Connection timeout
  useEffect(() => {
    if (connected) return;
    const timer = setTimeout(() => {
      if (!store.session) {
        setError(t.game.connectionFailed);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [connected, t, store]);

  // Save active session to localStorage for reconnect
  useEffect(() => {
    if (connected && sessionId) {
      saveActiveSession({
        sessionId,
        gameSlug,
        playerName,
        joinedAt: Date.now(),
      });
    }
  }, [connected, sessionId, playerName, gameSlug]);

  const sendMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (msg: any) => send(msg),
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
    if (isHost && session?.status === "lobby") {
      send({ type: "END_SESSION" });
      clearActiveSession();
    }
    store.reset();
    router.push(`/games/${gameSlug}`);
  };

  const handleRestart = () => {
    send({ type: "RESET_GAME" });
  };

  // --- Game Over View ---
  if (session?.status === "active" && gameState && isGameOver(gameState)) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 space-y-6">
        {renderGameOver({ session, gameState })}
        <div className="space-y-2">
          {isHost && (
            <Button
              onClick={handleRestart}
              className="w-full rounded-xl"
              size="lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t.common.newGameSamePlayers}
            </Button>
          )}
          <Button
            onClick={handleExit}
            variant="outline"
            className="w-full rounded-xl"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t.common.exitToLobby}
          </Button>
        </div>
      </div>
    );
  }

  // --- Game Active View ---
  if (session?.status === "active" && gameState) {
    return (
      <>
        {/* Top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-bold">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  connected ? "bg-emerald-500" : "animate-pulse bg-red-500"
                }`}
              />
              {gameTitle}
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

        {/* Game-specific content */}
        {renderGame({
          session,
          gameState,
          playerId,
          isHost,
          onSend: sendMessage,
        })}
      </>
    );
  }

  // --- Lobby View ---
  return (
    <SessionLobby
      gameTitle={gameTitle}
      session={session}
      connected={connected}
      isHost={isHost}
      error={error}
      onSend={sendMessage}
      onExit={handleExit}
      onStartGame={handleStartGame}
      onErrorDismiss={() => {
        clearActiveSession();
        store.reset();
        router.push(`/games/${gameSlug}`);
      }}
    />
  );
}

export function GameSessionShell(props: GameSessionShellProps) {
  const { t } = useI18n();
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <Suspense
        fallback={
          <p className="text-muted-foreground">{t.game.loadingSession}</p>
        }
      >
        <SessionContent {...props} />
      </Suspense>
    </main>
  );
}
