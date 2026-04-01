"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, Search } from "lucide-react";
import { FACTIONS } from "@/lib/games/dune-imperium/constants";
import type { DuneGameState, DuneAction, FactionId } from "@/lib/games/dune-imperium/types";
import type { Session } from "@/lib/games/types";
import { useI18n } from "@/lib/i18n";

const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

interface GuideTabProps {
  session: Session;
  gameState: DuneGameState;
  onSend: (msg: { type: "GAME_ACTION"; action: DuneAction }) => void;
  isHost: boolean;
}

function describeAction(
  action: DuneAction,
  session: Session,
  t: ReturnType<typeof import("@/lib/i18n").useI18n>["t"]
): string {
  const getName = (pid: string) =>
    session.players.find((p) => p.id === pid)?.name ?? pid;

  switch (action.type) {
    case "ADJUST_SPICE":
      return t.dune.history.actions.adjustedSpice(getName(action.playerId), action.delta);
    case "ADJUST_SOLARI":
      return t.dune.history.actions.adjustedSolari(getName(action.playerId), action.delta);
    case "ADJUST_WATER":
      return t.dune.history.actions.adjustedWater(getName(action.playerId), action.delta);
    case "ADJUST_VP":
      return t.dune.history.actions.adjustedVp(getName(action.playerId), action.delta);
    case "ADJUST_INTRIGUE":
      return t.dune.history.actions.adjustedIntrigue(getName(action.playerId), action.delta);
    case "ADJUST_INFLUENCE": {
      const factionName = t.dune.factions[action.faction as FactionId] ?? action.faction;
      return t.dune.history.actions.adjustedInfluence(getName(action.playerId), factionName, action.delta);
    }
    case "NEXT_ROUND":
      return t.dune.history.actions.nextRound;
    case "END_GAME":
      return t.dune.history.actions.gameEnded;
    case "UNDO":
      return t.dune.history.actions.undoAction;
    default:
      return t.dune.history.actions.unknown;
  }
}

function getPlayerColor(action: DuneAction, session: Session): string {
  if ("playerId" in action) {
    const player = session.players.find((p) => p.id === (action as { playerId: string }).playerId);
    return COLOR_CLASSES[player?.color ?? ""] ?? "bg-gray-400";
  }
  return "bg-gray-400";
}

// --- History Panel ---
function HistoryPanel({ session, gameState, onSend, isHost }: GuideTabProps) {
  const { t } = useI18n();
  const entries = [...gameState.history].reverse().slice(0, 30);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t.history.title}</h3>
        {isHost && gameState.history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-lg text-xs"
            onClick={() => onSend({ type: "GAME_ACTION", action: { type: "UNDO" } })}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            {t.history.undo}
          </Button>
        )}
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">{t.history.noActions}</p>
      )}

      <div className="space-y-1.5">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${getPlayerColor(entry.action, session)}`} />
            <span className="flex-1 text-muted-foreground">
              {describeAction(entry.action, session, t)}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(entry.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Tips Panel ---
function TipsPanel() {
  const { t } = useI18n();
  const levelColors: Record<string, string> = {
    newbie: "text-emerald-600",
    intermediate: "text-amber-600",
    experienced: "text-red-600",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t.dune.tips.title}</h3>
      <p className="text-xs text-muted-foreground">{t.dune.tips.subtitle}</p>
      <div className="space-y-2">
        {t.dune.tips.items.map((item, i) => (
          <details key={i} className="rounded-lg bg-card px-3 py-2 shadow-xs">
            <summary className="cursor-pointer text-xs font-medium">
              <span className={`${levelColors[item.level] ?? ""}`}>
                {t.mistakeLevel[item.level as keyof typeof t.mistakeLevel] ?? item.level}
              </span>
              {" — "}
              {item.title}
            </summary>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {item.description}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

// --- Rules Panel ---
function RulesPanel() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  // Build rules data from faction definitions + i18n
  const rulesData = [
    {
      section: t.dune.rules.sections.resources,
      items: [
        { term: t.dune.resources.spice, desc: t.dune.rules.resourceDescriptions.spice },
        { term: t.dune.resources.solari, desc: t.dune.rules.resourceDescriptions.solari },
        { term: t.dune.resources.water, desc: t.dune.rules.resourceDescriptions.water },
        { term: t.dune.resources.vp, desc: t.dune.rules.resourceDescriptions.vp },
      ],
    },
    {
      section: t.dune.rules.sections.factions,
      items: Object.values(FACTIONS).map((f) => ({
        term: t.dune.factions[f.id as FactionId] ?? f.name,
        desc: t.dune.rules.factionDesc(
          f.maxInfluence,
          f.allianceLevel,
          f.thresholds[0]?.level ?? 0,
          f.thresholds[0]?.reward.amount ?? 0,
          t.dune.resources[f.thresholds[0]?.reward.resource as keyof typeof t.dune.resources] ?? f.thresholds[0]?.reward.resource ?? ""
        ),
      })),
    },
    {
      section: t.dune.rules.sections.alliance,
      items: t.dune.rules.allianceItems,
    },
  ];

  const filtered = search
    ? rulesData
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.term.toLowerCase().includes(search.toLowerCase()) ||
              item.desc.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : rulesData;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t.dune.rules.title}</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t.dune.rules.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg pl-9 text-xs"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground">{t.dune.rules.noResults(search)}</p>
      )}

      {filtered.map((section, i) => (
        <details key={i} open={!search}>
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.section}
          </summary>
          <div className="mt-1.5 space-y-1">
            {section.items.map((item, j) => (
              <div key={j} className="rounded-lg bg-card px-3 py-2 shadow-xs flex gap-3">
                <span className="text-xs font-medium min-w-[80px] shrink-0">{item.term}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

// --- Main GuideTab ---
type SubTab = "history" | "tips" | "rules";

export function GuideTab(props: GuideTabProps) {
  const { t } = useI18n();
  const [subTab, setSubTab] = useState<SubTab>("history");

  const tabs: { id: SubTab; label: string }[] = [
    { id: "history", label: t.history.title },
    { id: "tips", label: t.dune.tips.title },
    { id: "rules", label: t.dune.rules.title },
  ];

  return (
    <div className="space-y-4 py-4">
      {/* Segmented control */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
              subTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "history" && <HistoryPanel {...props} />}
      {subTab === "tips" && <TipsPanel />}
      {subTab === "rules" && <RulesPanel />}
    </div>
  );
}
