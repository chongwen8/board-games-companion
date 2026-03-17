"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPlayerId,
  getPlayerName,
  setPlayerName,
} from "@/lib/utils/player-id";
import { useAuth } from "@/lib/hooks/use-auth";
import { LogOut, ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getActiveSession, clearActiveSession } from "@/lib/utils/active-session";
import { useI18n } from "@/lib/i18n";

export default function BrassLobbyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, loading, configured, signIn, signOut } = useAuth();
  const [name, setName] = useState(() => {
    return getPlayerName() || "";
  });
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [activeSession] = useState(() => getActiveSession());

  const effectiveName = user?.displayName && !name ? user.displayName : name;

  const handleCreate = useCallback(() => {
    const playerName = effectiveName.trim();
    if (!playerName) {
      setError(t.lobby.enterNameFirst);
      return;
    }
    setPlayerName(playerName);
    const roomId = crypto.randomUUID();
    router.push(
      `/games/brass-birmingham/${roomId}?action=create&name=${encodeURIComponent(playerName)}`
    );
  }, [effectiveName, router, t]);

  const handleJoin = useCallback(() => {
    const playerName = effectiveName.trim();
    if (!playerName) {
      setError(t.lobby.enterNameFirst);
      return;
    }
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setError(t.lobby.invalidCode);
      return;
    }
    setPlayerName(playerName);
    router.push(
      `/games/brass-birmingham/join?code=${code}&name=${encodeURIComponent(playerName)}`
    );
  }, [effectiveName, joinCode, router, t]);

  if (configured && loading) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">{t.lobby.loading}</p>
      </main>
    );
  }

  if (configured && !user) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center p-6">
        <h1 className="mb-1 text-2xl font-bold">{t.game.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{t.game.subtitle}</p>
        <Button onClick={signIn} size="lg" className="w-full max-w-sm rounded-xl">
          {t.lobby.signInGoogle}
        </Button>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between">
        <div />
        <LanguageSwitcher />
      </div>

      <h1 className="mb-1 text-2xl font-bold">{t.game.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{t.game.subtitle}</p>

      <div className="w-full max-w-sm space-y-6">
        {/* Rejoin active session */}
        {activeSession && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
            <p className="text-sm font-medium">You have an active session</p>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  router.push(
                    `/games/brass-birmingham/${activeSession.sessionId}?action=join&name=${encodeURIComponent(activeSession.playerName)}`
                  )
                }
                size="sm"
                className="flex-1 rounded-lg"
              >
                <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                Rejoin
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => {
                  clearActiveSession();
                  window.location.reload();
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Auth status */}
        {user && (
          <div className="flex items-center justify-between rounded-xl bg-card/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-xs text-muted-foreground active:text-foreground"
            >
              <LogOut className="h-3 w-3" />
              {t.lobby.signOut}
            </button>
          </div>
        )}

        <div>
          <label htmlFor="player-name" className="mb-2 block text-sm font-medium">
            {t.lobby.yourName}
          </label>
          <Input
            id="player-name"
            placeholder={t.lobby.enterName}
            value={effectiveName}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="rounded-xl text-base"
            autoComplete="off"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Create */}
        <div className="rounded-2xl bg-card/50 p-5 space-y-3">
          <p className="text-sm font-semibold">{t.lobby.newSession}</p>
          <Button onClick={handleCreate} className="w-full rounded-xl" size="lg">
            {t.lobby.createSession}
          </Button>
        </div>

        {/* Join */}
        <div className="rounded-2xl bg-card/50 p-5 space-y-3">
          <p className="text-sm font-semibold">{t.lobby.joinSession}</p>
          <Input
            placeholder={t.lobby.enterCode}
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase().slice(0, 4));
              setError("");
            }}
            className="rounded-xl text-center text-2xl font-mono tracking-[0.3em]"
            maxLength={4}
            autoComplete="off"
          />
          <Button
            onClick={handleJoin}
            variant="secondary"
            className="w-full rounded-xl"
            size="lg"
          >
            {t.lobby.join}
          </Button>
        </div>

        {user && (
          <Link
            href="/games/brass-birmingham/history"
            className="block text-center text-sm text-muted-foreground active:text-foreground"
          >
            {t.lobby.viewHistory}
          </Link>
        )}
      </div>
    </main>
  );
}
