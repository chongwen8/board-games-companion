"use client";

import { GameLobbyPage } from "@/components/GameLobbyPage";
import { useI18n } from "@/lib/i18n";

export default function DuneLobbyPage() {
  const { t } = useI18n();
  return (
    <GameLobbyPage
      gameSlug="dune-imperium"
      gameTitle={t.dune.game.title}
      gameSubtitle={t.dune.game.subtitle}
    />
  );
}
