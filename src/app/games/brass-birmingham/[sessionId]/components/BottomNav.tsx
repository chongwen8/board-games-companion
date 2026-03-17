"use client";

import { Home, Coins, Factory, Sliders, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type TabId = "dashboard" | "industry" | "guide";

const TABS: { id: TabId; icon: typeof Home; tKey: keyof ReturnType<typeof useI18n>["t"]["nav"] }[] = [
  { id: "dashboard", icon: Home, tKey: "dashboard" },
  { id: "industry", icon: Factory, tKey: "industry" },
  { id: "guide", icon: BookOpen, tKey: "guide" },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map(({ id, icon: Icon, tKey }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors active:opacity-70 ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span>{t.nav[tKey]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
