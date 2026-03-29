"use client";

import { useState } from "react";
import type { BrassGameState, BrassAction } from "@/lib/games/brass-birmingham/types";
import type { ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { Session } from "@/lib/games/types";
import { INDUSTRY_TILE_LEVELS } from "@/lib/games/brass-birmingham/constants";
import { Undo2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

type SubTab = "history" | "tips" | "rules";

/* ================================================================== */
/*  Main Guide Tab                                                     */
/* ================================================================== */

interface GuideTabProps {
  session: Session;
  gameState: BrassGameState;
  onSend: (msg: ClientMessage) => void;
  isHost: boolean;
}

export function GuideTab({ session, gameState, onSend, isHost }: GuideTabProps) {
  const { t } = useI18n();
  const [sub, setSub] = useState<SubTab>("history");

  const tabs: { id: SubTab; label: string }[] = [
    { id: "history", label: t.history.title },
    { id: "tips", label: t.mistakes.title },
    { id: "rules", label: t.rules.title },
  ];

  return (
    <div className="space-y-4">
      {/* Segmented control */}
      <div className="flex gap-1 rounded-xl bg-muted/70 p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
              sub === id
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground active:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {sub === "history" && (
        <HistoryPanel
          session={session}
          gameState={gameState}
          onSend={onSend}
          isHost={isHost}
        />
      )}
      {sub === "tips" && <TipsPanel />}
      {sub === "rules" && <RulesPanel />}
    </div>
  );
}

/* ================================================================== */
/*  History Panel                                                      */
/* ================================================================== */

function tileLevel(industry: string, index: number): number {
  const levels = INDUSTRY_TILE_LEVELS[industry];
  return levels?.[index] ?? index + 1;
}

const PLAYER_COLORS: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  purple: "bg-violet-500",
};

const TEXT_COLORS: Record<string, string> = {
  red: "text-red-600",
  yellow: "text-amber-600",
  green: "text-emerald-600",
  purple: "text-violet-600",
};

function HistoryPanel({
  session,
  gameState,
  onSend,
  isHost,
}: {
  session: Session;
  gameState: BrassGameState;
  onSend: (msg: ClientMessage) => void;
  isHost: boolean;
}) {
  const { t } = useI18n();
  const playerMap = Object.fromEntries(
    session.players.map((p) => [p.id, { name: p.name, color: p.color }])
  );

  const history = gameState.history ?? [];
  const recent = history.slice(-30).reverse();
  // _undoStack is stripped from broadcasts (kept server-side only),
  // so always show undo for host. Server ignores if stack is empty.

  const describe = (action: BrassAction): string => {
    const a = t.history.actions;
    const name = (pid: string) => playerMap[pid]?.name ?? "?";
    switch (action.type) {
      case "RECORD_SPEND": return a.spent(name(action.playerId), action.amount);
      case "ADJUST_SPEND": return a.spendingSet(name(action.playerId), action.amount);
      case "END_TURN": return a.turnEnded;
      case "END_ROUND": return a.roundEnded;
      case "NEXT_ERA": return a.eraTransition;
      case "TAKE_LOAN": return a.tookLoan(name(action.playerId));
      case "ADJUST_INCOME": return a.incomeAdjusted(name(action.playerId), action.delta);
      case "ADJUST_VP": return a.vpAdjusted(name(action.playerId), action.delta);
      case "ADJUST_MONEY": return a.moneyAdjusted(name(action.playerId), action.delta);
      case "BUILD_TILE": return a.built(name(action.playerId), action.industry, tileLevel(action.industry, action.index));
      case "DEVELOP_TILE": return a.developed(name(action.playerId), action.industry, tileLevel(action.industry, action.index));
      case "CYCLE_TILE": return a.toggled(name(action.playerId), action.industry, tileLevel(action.industry, action.index));
      case "END_GAME": return a.gameEnded;
      case "UNDO": return a.undoAction;
      default: return a.unknown;
    }
  };

  const getPlayerId = (action: BrassAction): string | null =>
    "playerId" in action ? (action as { playerId: string }).playerId : null;

  return (
    <>
      {/* Undo */}
      {isHost && (
        <button
          onClick={() => onSend({ type: "GAME_ACTION", action: { type: "UNDO" } })}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-muted/70 py-2.5 text-xs font-medium text-muted-foreground active:bg-muted"
        >
          <Undo2 className="h-3.5 w-3.5" />
          {t.history.undo}
        </button>
      )}

      {recent.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground/50">
          {t.history.noActions}
        </p>
      ) : (
        <div className="space-y-px">
          {recent.map((entry, idx) => {
            const pid = getPlayerId(entry.action);
            const player = pid ? playerMap[pid] : null;
            const color = player ? TEXT_COLORS[player.color] ?? "" : "";

            return (
              <div
                key={history.length - 1 - idx}
                className="flex items-center gap-3 py-1.5"
              >
                {/* Color dot or system dot */}
                {player ? (
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PLAYER_COLORS[player.color] ?? "bg-muted-foreground"}`} />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                )}

                {/* Description */}
                <span className={`flex-1 text-xs ${color || "text-muted-foreground"}`}>
                  {describe(entry.action)}
                </span>

                {/* Time */}
                <span className="text-[10px] tabular-nums text-muted-foreground/40">
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ================================================================== */
/*  Tips Panel                                                         */
/* ================================================================== */

const LEVEL_DOT: Record<string, string> = {
  newbie: "bg-emerald-400",
  intermediate: "bg-amber-400",
  experienced: "bg-rose-400",
};

function TipsPanel() {
  const { t } = useI18n();

  return (
    <>
      <p className="text-xs text-muted-foreground/60">{t.mistakes.subtitle}</p>

      {/* Level legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground/50">
        {(["newbie", "intermediate", "experienced"] as const).map((key) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[key]}`} />
            {t.mistakeLevel[key]}
          </span>
        ))}
      </div>

      <div className="space-y-1">
        {t.mistakes.items.map((item, idx) => (
          <details key={idx} className="group">
            <summary className="flex cursor-pointer items-center gap-2.5 rounded-lg py-2.5 active:bg-muted/20 [&::-webkit-details-marker]:hidden list-none">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${LEVEL_DOT[item.level] ?? LEVEL_DOT.newbie}`} />
              <span className="flex-1 text-sm">{item.title}</span>
              <span className="text-muted-foreground/30 text-xs group-open:rotate-90 transition-transform">›</span>
            </summary>
            <p className="pb-2 pl-4 text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </details>
        ))}
      </div>
    </>
  );
}

/* ================================================================== */
/*  Rules Panel                                                        */
/* ================================================================== */

interface RuleItem {
  term: string;
  termZh?: string;
  description: string;
  descriptionZh?: string;
}

const RULES: { key: string; items: RuleItem[] }[] = [
  {
    key: "actions",
    items: [
      { term: "Build", termZh: "\u5EFA\u9020", description: "Place an industry tile onto the board. Pay money + resources.", descriptionZh: "\u5C06\u5DE5\u4E1A\u7247\u653E\u5230\u68CB\u76D8\u4E0A\u3002\u652F\u4ED8\u8D44\u91D1\u548C\u8D44\u6E90\u3002" },
      { term: "Network", termZh: "\u7F51\u7EDC", description: "Place a canal (\u00A33) or rail (\u00A35 + coal + beer) link.", descriptionZh: "\u653E\u7F6E\u8FD0\u6CB3 (\u00A33) \u6216\u94C1\u8DEF (\u00A35+\u7164+\u9152) \u94FE\u63A5\u3002" },
      { term: "Develop", termZh: "\u53D1\u5C55", description: "Remove 1-2 lowest tiles from game. 1 iron each. Skip levels.", descriptionZh: "\u79FB\u9664 1-2 \u4E2A\u6700\u4F4E\u7EA7\u7247\u3002\u6BCF\u7247 1 \u94C1\u3002\u53EF\u8DF3\u7EA7\u3002" },
      { term: "Sell", termZh: "\u51FA\u552E", description: "Sell cotton/manufacturer/pottery to merchant. Needs beer. Gain VP + income.", descriptionZh: "\u51FA\u552E\u68C9/\u5236\u9020/\u9676\u74F7\u7ED9\u5546\u4EBA\u3002\u9700\u9152\u3002\u83B7 VP+\u6536\u5165\u3002" },
      { term: "Loan", termZh: "\u8D37\u6B3E", description: "+\u00A330, -3 income levels. No limit.", descriptionZh: "+\u00A330\uFF0C-3 \u7EA7\u6536\u5165\u3002\u65E0\u9650\u5236\u3002" },
      { term: "Scout", termZh: "\u4FA6\u5BDF", description: "Discard 3 \u2192 draw 1 wild location + 1 wild industry.", descriptionZh: "\u5F03 3 \u5F20 \u2192 \u62BD 1 \u4E07\u80FD\u5730\u70B9 + 1 \u4E07\u80FD\u5DE5\u4E1A\u3002" },
      { term: "Pass", termZh: "\u8DF3\u8FC7", description: "Discard 1-2 cards, no action. Records \u00A30 spent.", descriptionZh: "\u5F03 1-2 \u5F20\u724C\uFF0C\u4E0D\u884C\u52A8\u3002\u8BB0\u5F55\u652F\u51FA \u00A30\u3002" },
    ],
  },
  {
    key: "resources",
    items: [
      { term: "Coal", termZh: "\u7164",
        description: "Needs connection. 1) Closest connected Coal Mine (free). 2) If none: buy from Coal Market (need connection to merchant icon). Empty market = \u00A38.",
        descriptionZh: "\u9700\u8981\u8FDE\u63A5\u3002\u2460 \u6700\u8FD1\u8FDE\u63A5\u7684\u7164\u77FF\uFF08\u514D\u8D39\uFF09\u3002\u2461 \u65E0\u7164\u77FF\u65F6\uFF1A\u4ECE\u7164\u5E02\u573A\u4E70\uFF08\u9700\u8FDE\u63A5\u5546\u4EBA\u56FE\u6807\uFF09\u3002\u5E02\u573A\u7A7A = \u00A38\u3002" },
      { term: "Iron", termZh: "\u94C1",
        description: "No connection needed. 1) Any unflipped Iron Works (free, any player). 2) If none: buy from Iron Market. Empty market = \u00A36.",
        descriptionZh: "\u65E0\u9700\u8FDE\u63A5\u3002\u2460 \u4EFB\u4F55\u672A\u7FFB\u94C1\u5382\uFF08\u514D\u8D39\uFF0C\u4EFB\u610F\u73A9\u5BB6\uFF09\u3002\u2461 \u65E0\u94C1\u5382\u65F6\uFF1A\u4ECE\u94C1\u5E02\u573A\u4E70\u3002\u5E02\u573A\u7A7A = \u00A36\u3002" },
      { term: "Beer", termZh: "\u9152",
        description: "1) Your own Brewery \u2014 no connection needed. 2) Opponent's Brewery \u2014 must be connected (flips their brewery). 3) Merchant tile space (when selling). Multiple beers can come from different sources.",
        descriptionZh: "\u2460 \u81EA\u5DF1\u917F\u9152\u5382 \u2014 \u65E0\u9700\u8FDE\u63A5\u3002\u2461 \u5BF9\u624B\u917F\u9152\u5382 \u2014 \u9700\u8FDE\u63A5\uFF08\u4F1A\u7FFB\u8F6C\uFF09\u3002\u2462 \u5546\u4EBA\u7247\u65C1\u7684\u9152\uFF08\u51FA\u552E\u65F6\uFF09\u3002\u591A\u74F6\u9152\u53EF\u6765\u81EA\u4E0D\u540C\u6765\u6E90\u3002" },
    ],
  },
  {
    key: "network",
    items: [
      { term: "Connected", termZh: "\u8FDE\u63A5",
        description: "Any unbroken path of link tiles (anyone's). Used for moving resources and selling. You can use opponent's links freely.",
        descriptionZh: "\u4EFB\u4F55\u4EBA\u94FE\u63A5\u7247\u7EC4\u6210\u7684\u4E0D\u65AD\u8DEF\u5F84\u3002\u7528\u4E8E\u8D44\u6E90\u8FD0\u8F93\u548C\u51FA\u552E\u3002\u53EF\u81EA\u7531\u4F7F\u7528\u5BF9\u624B\u7684\u94FE\u63A5\u3002" },
      { term: "Your Network", termZh: "\u4F60\u7684\u7F51\u7EDC",
        description: "Locations with your industry tiles + locations adjacent to your links. Determines where you can build and expand.",
        descriptionZh: "\u6709\u4F60\u5DE5\u4E1A\u7247\u7684\u4F4D\u7F6E + \u4F60\u94FE\u63A5\u76F8\u90BB\u7684\u4F4D\u7F6E\u3002\u51B3\u5B9A\u4F60\u80FD\u5728\u54EA\u5EFA\u9020\u548C\u6269\u5C55\u3002" },
      { term: "Build rule", termZh: "\u5EFA\u9020\u89C4\u5219",
        description: "Industry cards: must build within Your Network. Location cards: must build at that specific location.",
        descriptionZh: "\u5DE5\u4E1A\u724C\uFF1A\u5FC5\u987B\u5728\u4F60\u7684\u7F51\u7EDC\u5185\u5EFA\u3002\u5730\u70B9\u724C\uFF1A\u5FC5\u987B\u5728\u6307\u5B9A\u5730\u70B9\u5EFA\u3002" },
    ],
  },
  {
    key: "links",
    items: [
      { term: "Permanent", termZh: "\u6C38\u4E45\u6027",
        description: "Links cannot be overbuilt or replaced. Opponent's link = their route for the era. Find another way.",
        descriptionZh: "\u94FE\u63A5\u4E0D\u80FD\u8986\u76D6\u6216\u66FF\u6362\u3002\u5BF9\u624B\u7684\u94FE\u63A5 = \u672C\u65F6\u4EE3\u5C5E\u4E8E\u4ED6\u4EEC\u3002\u53EA\u80FD\u7ED5\u8DEF\u3002" },
      { term: "Expand", termZh: "\u6269\u5C55",
        description: "New links must connect to Your Network. Network action places canal or rail on the board.",
        descriptionZh: "\u65B0\u94FE\u63A5\u5FC5\u987B\u8FDE\u63A5\u5230\u4F60\u7684\u7F51\u7EDC\u3002\u7F51\u7EDC\u884C\u52A8\u5728\u68CB\u76D8\u4E0A\u653E\u7F6E\u8FD0\u6CB3\u6216\u94C1\u8DEF\u3002" },
      { term: "Rail Era", termZh: "\u94C1\u8DEF\u65F6\u4EE3",
        description: "Some routes have 2 track slots \u2014 both players can build there. But you still can't replace an existing track.",
        descriptionZh: "\u90E8\u5206\u8DEF\u7EBF\u6709 2 \u4E2A\u8F68\u9053\u69FD\u4F4D \u2014 \u4E24\u4EBA\u53EF\u540C\u65F6\u5EFA\u3002\u4F46\u4ECD\u4E0D\u80FD\u66FF\u6362\u5DF2\u6709\u8F68\u9053\u3002" },
    ],
  },
  {
    key: "turnOrder",
    items: [
      { term: "Spending rule", termZh: "\u652F\u51FA\u89C4\u5219", description: "Least spent \u2192 first next round. Ties: previous order.", descriptionZh: "\u652F\u51FA\u6700\u5C11 \u2192 \u4E0B\u56DE\u5408\u5148\u624B\u3002\u5E73\u5C40\u6309\u539F\u987A\u5E8F\u3002" },
      { term: "First round", termZh: "\u7B2C\u4E00\u56DE\u5408", description: "1 action only. All other rounds: 2 actions.", descriptionZh: "\u4EC5 1 \u6B21\u884C\u52A8\u3002\u5176\u4ED6\u56DE\u5408 2 \u6B21\u3002" },
      { term: "Rounds/era", termZh: "\u6BCF\u65F6\u4EE3\u56DE\u5408\u6570", description: "2p: 10. 3p: 9. 4p: 8.", descriptionZh: "2\u4EBA: 10\u30023\u4EBA: 9\u30024\u4EBA: 8\u3002" },
    ],
  },
  {
    key: "overbuild",
    items: [
      { term: "Basics", termZh: "\u57FA\u672C", description: "Replace a board tile with higher-level same industry. Build action, full cost.", descriptionZh: "\u7528\u66F4\u9AD8\u7EA7\u540C\u5DE5\u4E1A\u7247\u66FF\u6362\u68CB\u76D8\u4E0A\u7684\u7247\u3002\u5EFA\u9020\u884C\u52A8\uFF0C\u5168\u989D\u4ED8\u8D39\u3002" },
      { term: "Your tiles", termZh: "\u81EA\u5DF1\u7684\u7247", description: "Overbuild any of your own tiles, any industry.", descriptionZh: "\u53EF\u8986\u76D6\u81EA\u5DF1\u4EFB\u4F55\u7C7B\u578B\u7684\u7247\u3002" },
      { term: "Opponent", termZh: "\u5BF9\u624B\u7684\u7247", description: "Only coal/iron. Only when 0 cubes of that resource on board + market.", descriptionZh: "\u4EC5\u7164\u77FF/\u94C1\u5382\u3002\u4E14\u68CB\u76D8+\u5E02\u573A\u8BE5\u8D44\u6E90\u4E3A 0 \u65F6\u3002" },
      { term: "Cannot", termZh: "\u4E0D\u53EF\u8986\u76D6", description: "Never overbuild opponent's brewery, cotton, manufacturer, or pottery.", descriptionZh: "\u4E0D\u80FD\u8986\u76D6\u5BF9\u624B\u7684\u917F\u9152\u5382\u3001\u68C9\u3001\u5236\u9020\u3001\u9676\u74F7\u3002" },
      { term: "VP kept", termZh: "VP \u4FDD\u7559", description: "Overbuilt flipped tiles keep VP. New tile must flip again to score.", descriptionZh: "\u88AB\u8986\u76D6\u7684\u5DF2\u7FFB\u7247\u4FDD\u7559 VP\u3002\u65B0\u7247\u9700\u518D\u7FFB\u8F6C\u624D\u5F97\u5206\u3002" },
    ],
  },
  {
    key: "scoring",
    items: [
      { term: "Links", termZh: "\u94FE\u63A5", description: "VP = sum of VP icons at both ends.", descriptionZh: "VP = \u4E24\u7AEF VP \u56FE\u6807\u4E4B\u548C\u3002" },
      { term: "Industry", termZh: "\u5DE5\u4E1A", description: "Flipped tiles score their VP. Unflipped = 0.", descriptionZh: "\u7FFB\u8F6C\u7684\u7247\u5F97 VP\u3002\u672A\u7FFB = 0\u3002" },
      { term: "End-game", termZh: "\u7EC8\u5C40", description: "\u00A310 remaining = 1 VP. Loans: -1 VP per \u00A310 owed.", descriptionZh: "\u5269\u4F59 \u00A310 = 1 VP\u3002\u8D37\u6B3E: \u6BCF \u00A310 \u6263 1 VP\u3002" },
    ],
  },
];

function RulesPanel() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();
  const isZh = locale === "zh";

  const filtered = RULES.map((section) => ({
    ...section,
    title: t.rules.sections[section.key as keyof typeof t.rules.sections] ?? section.key,
    items: section.items.filter((item) => {
      if (!query) return true;
      const term = isZh ? (item.termZh ?? item.term) : item.term;
      const desc = isZh ? (item.descriptionZh ?? item.description) : item.description;
      return term.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
    }),
  })).filter((s) => s.items.length > 0);

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
        <Input
          placeholder={t.rules.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl bg-muted/60 border-0 pl-9 text-sm h-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground/50">
          {t.rules.noResults(search)}
        </p>
      ) : (
        filtered.map((section) => (
          <div key={section.key}>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {section.title}
            </p>
            <div className="space-y-px">
              {section.items.map((item) => (
                <div key={item.term} className="flex gap-3 py-2">
                  <span className="w-16 shrink-0 text-xs font-semibold">
                    {isZh ? (item.termZh ?? item.term) : item.term}
                  </span>
                  <span className="flex-1 text-xs text-muted-foreground">
                    {isZh ? (item.descriptionZh ?? item.description) : item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
