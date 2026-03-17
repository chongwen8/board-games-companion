"use client";

import { useI18n } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

const LEVEL_STYLE: Record<string, { bg: string; text: string; key: string }> = {
  newbie: { bg: "bg-emerald-500/10", text: "text-emerald-400", key: "newbie" },
  intermediate: { bg: "bg-amber-500/10", text: "text-amber-400", key: "intermediate" },
  experienced: { bg: "bg-rose-500/10", text: "text-rose-400", key: "experienced" },
};

export function CommonMistakes() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t.mistakes.title}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">{t.mistakes.subtitle}</p>

      <div className="space-y-2">
        {t.mistakes.items.map((item, idx) => {
          const style = LEVEL_STYLE[item.level] ?? LEVEL_STYLE.newbie;
          return (
            <div key={idx} className="rounded-xl bg-card/50 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
                  {t.mistakeLevel[style.key as keyof typeof t.mistakeLevel]}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
