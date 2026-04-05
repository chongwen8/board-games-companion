"use client";

import { GameLobbyPage } from "@/components/GameLobbyPage";
import { useI18n } from "@/lib/i18n";

export default function DuneUprisingLobbyPage() {
  const { t } = useI18n();
  return (
    <GameLobbyPage
      gameSlug="dune-imperium-uprising"
      gameTitle={t.dune.game.titleUprising}
      gameSubtitle={t.dune.game.subtitle}
    />
  );
}
