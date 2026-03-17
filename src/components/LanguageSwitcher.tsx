"use client";

import { useI18n, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const toggle = () => {
    setLocale(locale === "en" ? "zh" : "en" as Locale);
  };

  return (
    <button
      onClick={toggle}
      className="flex h-7 items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 text-xs font-medium text-muted-foreground transition-colors active:bg-muted"
    >
      <span className="text-[10px]">
        {locale === "en" ? "EN" : "\u4E2D"}
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 5h12M9 3v2m0 0c1.5 3-3 7.5-6.5 9.5M5.5 7c1.5 2.5 4 4 6.5 5.5" />
        <path d="M14 12l4 6 4-6" />
        <path d="M15.5 18h5" />
      </svg>
    </button>
  );
}
