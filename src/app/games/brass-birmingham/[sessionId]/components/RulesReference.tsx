"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface RuleItem {
  term: string;
  termZh?: string;
  description: string;
  descriptionZh?: string;
}

interface RuleSection {
  key: string;
  items: RuleItem[];
}

const RULES: RuleSection[] = [
  {
    key: "actions",
    items: [
      { term: "Build", termZh: "\u5EFA\u9020", description: "Place an industry tile from your player mat onto the board. Pay the cost in money and resources (coal/iron).", descriptionZh: "\u5C06\u5DE5\u4E1A\u7247\u4ECE\u73A9\u5BB6\u677F\u653E\u5230\u68CB\u76D8\u4E0A\u3002\u652F\u4ED8\u8D44\u91D1\u548C\u8D44\u6E90\uFF08\u7164/\u94C1\uFF09\u3002" },
      { term: "Network", termZh: "\u7F51\u7EDC", description: "Place a canal (Canal Era) or rail (Rail Era) link. Canals cost \u00A33, rails cost \u00A35 + 1 coal + 1 beer.", descriptionZh: "\u653E\u7F6E\u8FD0\u6CB3\uFF08\u8FD0\u6CB3\u65F6\u4EE3\uFF09\u6216\u94C1\u8DEF\uFF08\u94C1\u8DEF\u65F6\u4EE3\uFF09\u94FE\u63A5\u3002\u8FD0\u6CB3 \u00A33\uFF0C\u94C1\u8DEF \u00A35 + 1\u7164 + 1\u9152\u3002" },
      { term: "Develop", termZh: "\u53D1\u5C55", description: "Remove 1-2 lowest-level tiles from the game (not board). Costs 1 iron per tile. Skip to higher levels.", descriptionZh: "\u4ECE\u6E38\u620F\u4E2D\u79FB\u9664 1-2 \u4E2A\u6700\u4F4E\u7EA7\u5DE5\u4E1A\u7247\u3002\u6BCF\u7247\u8017\u8D39 1 \u94C1\u3002\u53EF\u8DF3\u7EA7\u3002" },
      { term: "Sell", termZh: "\u51FA\u552E", description: "Sell cotton, manufacturer, or pottery to a connected merchant. Flip tile, gain VP and income. Requires beer.", descriptionZh: "\u5411\u8FDE\u63A5\u7684\u5546\u4EBA\u51FA\u552E\u68C9\u82B1/\u5236\u9020/\u9676\u74F7\u3002\u7FFB\u8F6C\u5DE5\u4E1A\u7247\uFF0C\u83B7\u5F97 VP \u548C\u6536\u5165\u3002\u9700\u8981\u9152\u3002" },
      { term: "Loan", termZh: "\u8D37\u6B3E", description: "Take \u00A330 from the bank. Income drops 3 levels. No limit on loans.", descriptionZh: "\u4ECE\u94F6\u884C\u53D6 \u00A330\u3002\u6536\u5165\u4E0B\u964D 3 \u7EA7\u3002\u65E0\u8D37\u6B3E\u6B21\u6570\u9650\u5236\u3002" },
      { term: "Scout", termZh: "\u4FA6\u5BDF", description: "Discard 3 cards, draw 1 wild location + 1 wild industry card.", descriptionZh: "\u5F03\u7F6E 3 \u5F20\u724C\uFF0C\u83B7\u5F97 1 \u5F20\u4E07\u80FD\u5730\u70B9\u724C + 1 \u5F20\u4E07\u80FD\u5DE5\u4E1A\u724C\u3002" },
      { term: "Pass", termZh: "\u8DF3\u8FC7", description: "Discard 1-2 cards and take no action. Still records \u00A30 spent for turn order.", descriptionZh: "\u5F03\u7F6E 1-2 \u5F20\u724C\uFF0C\u4E0D\u6267\u884C\u64CD\u4F5C\u3002\u4ECD\u8BB0\u5F55\u652F\u51FA \u00A30\u3002" },
    ],
  },
  {
    key: "resources",
    items: [
      { term: "Coal", termZh: "\u7164\u70AD", description: "Needed for rails and some industries. From nearest connected coal mine, or buy from market.", descriptionZh: "\u94C1\u8DEF\u548C\u90E8\u5206\u5DE5\u4E1A\u9700\u8981\u3002\u4ECE\u6700\u8FD1\u8FDE\u63A5\u7684\u7164\u77FF\u53D6\uFF0C\u6216\u4ECE\u5E02\u573A\u8D2D\u4E70\u3002" },
      { term: "Iron", termZh: "\u94C1", description: "Needed for building and developing. Taken from ANY iron works (no connection needed). Or buy from market.", descriptionZh: "\u5EFA\u9020\u548C\u53D1\u5C55\u9700\u8981\u3002\u53EF\u4ECE\u4EFB\u4F55\u94C1\u5382\u53D6\uFF08\u65E0\u9700\u8FDE\u63A5\uFF09\u3002\u6216\u4ECE\u5E02\u573A\u8D2D\u4E70\u3002" },
      { term: "Beer", termZh: "\u5564\u9152", description: "Needed to sell. Must be from a connected brewery. Using opponent's beer flips their brewery.", descriptionZh: "\u51FA\u552E\u65F6\u9700\u8981\u3002\u5FC5\u987B\u6765\u81EA\u8FDE\u63A5\u7684\u917F\u9152\u5382\u3002\u4F7F\u7528\u5BF9\u624B\u7684\u9152\u4F1A\u7FFB\u8F6C\u5176\u917F\u9152\u5382\u3002" },
    ],
  },
  {
    key: "turnOrder",
    items: [
      { term: "Spending rule", termZh: "\u652F\u51FA\u89C4\u5219", description: "End of round: least spent goes first. Ties broken by previous order.", descriptionZh: "\u56DE\u5408\u7ED3\u675F\uFF1A\u652F\u51FA\u6700\u5C11\u7684\u5148\u884C\u52A8\u3002\u5E73\u5C40\u6309\u4E4B\u524D\u987A\u5E8F\u3002" },
      { term: "First round", termZh: "\u7B2C\u4E00\u56DE\u5408", description: "First round of each era: 1 action only. All subsequent rounds: 2 actions.", descriptionZh: "\u6BCF\u4E2A\u65F6\u4EE3\u7B2C\u4E00\u56DE\u5408\uFF1A\u4EC5 1 \u6B21\u884C\u52A8\u3002\u4E4B\u540E\u6BCF\u56DE\u5408 2 \u6B21\u3002" },
      { term: "Rounds", termZh: "\u56DE\u5408\u6570", description: "2p: 10 rounds. 3p: 9 rounds. 4p: 8 rounds per era.", descriptionZh: "2\u4EBA: 10 \u56DE\u5408\u30023\u4EBA: 9 \u56DE\u5408\u30024\u4EBA: \u6BCF\u4E2A\u65F6\u4EE3 8 \u56DE\u5408\u3002" },
    ],
  },
  {
    key: "eraTransition",
    items: [
      { term: "Canal \u2192 Rail", termZh: "\u8FD0\u6CB3 \u2192 \u94C1\u8DEF", description: "Score VP. Remove canal links and Level I tiles. Reshuffle merchants. Keep money/income/tiles.", descriptionZh: "\u8BA1\u7B97 VP\u3002\u79FB\u9664\u8FD0\u6CB3\u548C\u4E00\u7EA7\u7247\u3002\u91CD\u6D17\u5546\u4EBA\u3002\u4FDD\u7559\u8D44\u91D1/\u6536\u5165/\u7247\u3002" },
      { term: "Rail Era", termZh: "\u94C1\u8DEF\u65F6\u4EE3", description: "Double links allowed. No Level I builds. Can overbuild own Level I on board.", descriptionZh: "\u5141\u8BB8\u53CC\u94FE\u63A5\u3002\u4E0D\u80FD\u5EFA\u4E00\u7EA7\u3002\u53EF\u8986\u76D6\u81EA\u5DF1\u68CB\u76D8\u4E0A\u7684\u4E00\u7EA7\u3002" },
    ],
  },
  {
    key: "scoring",
    items: [
      { term: "Links", termZh: "\u94FE\u63A5\u5F97\u5206", description: "Each link scores VP = sum of VP icons in both connected locations.", descriptionZh: "\u6BCF\u4E2A\u94FE\u63A5\u5F97\u5206 = \u4E24\u4E2A\u8FDE\u63A5\u4F4D\u7F6E\u7684 VP \u56FE\u6807\u4E4B\u548C\u3002" },
      { term: "Industry", termZh: "\u5DE5\u4E1A\u5F97\u5206", description: "Flipped industry tiles score their VP value. Unflipped = 0.", descriptionZh: "\u7FFB\u8F6C\u7684\u5DE5\u4E1A\u7247\u5F97\u5176 VP \u503C\u3002\u672A\u7FFB\u8F6C = 0\u3002" },
      { term: "End-game", termZh: "\u7EC8\u5C40\u52A0\u5206", description: "Each \u00A310 remaining = 1 VP. Loans: -1 VP per \u00A310 owed.", descriptionZh: "\u6BCF\u5269\u4F59 \u00A310 = 1 VP\u3002\u8D37\u6B3E\uFF1A\u6BCF \u00A310 \u6263 1 VP\u3002" },
    ],
  },
  {
    key: "industries",
    items: [
      { term: "Coal Mine", termZh: "\u7164\u77FF", description: "Produces coal. Flips when all coal taken. Levels 1-4.", descriptionZh: "\u4EA7\u7164\u3002\u7164\u53D6\u5B8C\u540E\u7FFB\u8F6C\u3002\u7B49\u7EA7 1-4\u3002" },
      { term: "Iron Works", termZh: "\u94C1\u5382", description: "Produces iron. No connection needed to use. Levels 1-4.", descriptionZh: "\u4EA7\u94C1\u3002\u4F7F\u7528\u65E0\u9700\u8FDE\u63A5\u3002\u7B49\u7EA7 1-4\u3002" },
      { term: "Brewery", termZh: "\u917F\u9152\u5382", description: "Produces beer. Flips when beer used for selling. Levels 1-4.", descriptionZh: "\u4EA7\u9152\u3002\u9152\u88AB\u4F7F\u7528\u540E\u7FFB\u8F6C\u3002\u7B49\u7EA7 1-4\u3002" },
      { term: "Cotton Mill", termZh: "\u68C9\u7EBA\u5382", description: "Sells to merchants for VP and income. Levels 1-4.", descriptionZh: "\u5411\u5546\u4EBA\u51FA\u552E\u6362\u53D6 VP \u548C\u6536\u5165\u3002\u7B49\u7EA7 1-4\u3002" },
      { term: "Manufacturer", termZh: "\u5236\u9020\u5382", description: "Sells to merchants. Higher levels = more VP. Levels 1-8.", descriptionZh: "\u5411\u5546\u4EBA\u51FA\u552E\u3002\u7B49\u7EA7\u8D8A\u9AD8 VP \u8D8A\u591A\u3002\u7B49\u7EA7 1-8\u3002" },
      { term: "Pottery", termZh: "\u9676\u74F7\u5382", description: "Sells to merchants. Highest VP potential. Levels 1-5.", descriptionZh: "\u5411\u5546\u4EBA\u51FA\u552E\u3002VP \u6F5C\u529B\u6700\u9AD8\u3002\u7B49\u7EA7 1-5\u3002" },
    ],
  },
];

export function RulesReference() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();
  const isZh = locale === "zh";

  const sectionKeys = Object.keys(t.rules.sections) as Array<keyof typeof t.rules.sections>;

  const filtered = RULES.map((section) => ({
    ...section,
    title: t.rules.sections[section.key as keyof typeof t.rules.sections] ?? section.key,
    items: section.items.filter((item) => {
      if (!query) return true;
      const term = isZh ? (item.termZh ?? item.term) : item.term;
      const desc = isZh ? (item.descriptionZh ?? item.description) : item.description;
      return term.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          placeholder={t.rules.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl pl-9 text-sm"
        />
      </div>

      {filtered.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t.rules.noResults(search)}
        </p>
      )}

      {filtered.map((section) => (
        <div key={section.key}>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {section.title}
          </h3>
          <div className="space-y-1.5">
            {section.items.map((item) => (
              <div key={item.term} className="rounded-xl bg-card/50 px-4 py-3">
                <p className="text-sm font-semibold">
                  {isZh ? (item.termZh ?? item.term) : item.term}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {isZh ? (item.descriptionZh ?? item.description) : item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
