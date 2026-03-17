"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { getUserSessions, type SessionDoc } from "@/lib/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SessionEntry {
  id: string;
  data: SessionDoc;
}

export default function HistoryPage() {
  const { user, loading, configured } = useAuth();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      setFetching(false);
      return;
    }
    getUserSessions(user.uid)
      .then(setSessions)
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!configured || !user) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">
          Sign in to view your game history.
        </p>
        <Link href="/games/brass-birmingham">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lobby
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/games/brass-birmingham">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Game History</h1>
      </div>

      {fetching && (
        <p className="text-center text-muted-foreground">Loading sessions...</p>
      )}

      {!fetching && sessions.length === 0 && (
        <p className="text-center text-muted-foreground">
          No past sessions found.
        </p>
      )}

      <div className="space-y-3">
        {sessions.map((entry) => {
          const d = entry.data;
          const statusColor =
            d.status === "active"
              ? "bg-green-500"
              : d.status === "finished"
                ? "bg-muted-foreground"
                : "bg-yellow-500";

          return (
            <Link
              key={entry.id}
              href={`/games/brass-birmingham/${entry.id}?action=join&name=${encodeURIComponent(user.displayName ?? "Player")}`}
              className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${statusColor}`}
                  />
                  <span className="text-sm font-medium">
                    Code: {d.code}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {d.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {d.playerUids.length} players
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
