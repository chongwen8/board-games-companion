"use client";

import Link from "next/link";
import { GAMES } from "@/lib/games/registry";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function HomePage() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="mb-6 flex w-full max-w-sm items-center justify-end">
        <LanguageSwitcher />
      </div>
      <h1 className="mb-2 text-3xl font-bold">{t.home.title}</h1>
      <p className="mb-8 text-muted-foreground">{t.home.subtitle}</p>
      <div className="grid w-full max-w-sm gap-4">
        {Object.values(GAMES).map((game) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
          >
            <h2 className="text-xl font-semibold">{t.home.games[game.slug]?.name ?? game.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.home.games[game.slug]?.description ?? game.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {game.minPlayers}–{game.maxPlayers} {t.home.players}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
