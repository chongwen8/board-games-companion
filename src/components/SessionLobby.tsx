"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import type { Session } from "@/lib/games/types";

const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface SessionLobbyProps {
  gameTitle: string;
  session: Session | null;
  connected: boolean;
  isHost: boolean;
  error: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSend: (msg: any) => void;
  onExit: () => void;
  onStartGame: () => void;
  onErrorDismiss: () => void;
}

export function SessionLobby({
  gameTitle,
  session,
  connected,
  isHost,
  error,
  onSend,
  onExit,
  onStartGame,
  onErrorDismiss,
}: SessionLobbyProps) {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold">{gameTitle}</h1>
          {!connected && (
            <Badge variant="destructive" className="mt-2">
              {t.game.connecting}
            </Badge>
          )}
        </div>
        <LanguageSwitcher />
      </div>

      {error && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={onErrorDismiss}
          >
            {t.endOfRound.back}
          </Button>
        </div>
      )}

      {session && (
        <>
          <div className="rounded-2xl bg-card shadow-sm p-6 text-center">
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
                  className="flex items-center gap-3 rounded-xl bg-card shadow-xs px-4 py-3"
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
                        onSend({ type: "REMOVE_BOT", botId: p.id })
                      }
                      className="rounded-lg p-2 text-muted-foreground active:bg-destructive/20 active:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <span
                      className={`text-xs ${p.connected ? "text-emerald-600" : "text-muted-foreground"}`}
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
                onClick={() => onSend({ type: "ADD_BOT" })}
              >
                {t.lobby.addBot}
              </Button>
            )}
          </div>

          {isHost && session.players.length >= 2 && (
            <Button onClick={onStartGame} className="w-full rounded-xl" size="lg">
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
        onClick={onExit}
        className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground active:text-foreground"
      >
        <LogOut className="h-3 w-3" />
        {isHost ? "End Session & Exit" : "Leave Session"}
      </button>
    </div>
  );
}
