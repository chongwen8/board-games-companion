import Link from "next/link";
import { GAMES } from "@/lib/games/registry";

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <h1 className="mb-2 text-3xl font-bold">Board Games Companion</h1>
      <p className="mb-8 text-muted-foreground">Pick a game to get started</p>
      <div className="grid w-full max-w-sm gap-4">
        {Object.values(GAMES).map((game) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
          >
            <h2 className="text-xl font-semibold">{game.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {game.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {game.minPlayers}–{game.maxPlayers} players
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
