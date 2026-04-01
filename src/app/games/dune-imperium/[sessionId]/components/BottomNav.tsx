"use client";

import { Home, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type TabId = "dashboard" | "guide";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: typeof Home; labelKey: "dashboard" | "guide" }[] = [
  { id: "dashboard", icon: Home, labelKey: "dashboard" },
  { id: "guide", icon: BookOpen, labelKey: "guide" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ id, icon: Icon, labelKey }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${
                isActive
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              {t.nav[labelKey]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
